/**
 * Endpoints para que un asesor humano genere links de pago desde una interfaz.
 *
 * Caso de uso: la IA no cerró la venta, o el cliente no pagó y el link se venció.
 *
 * Está en un archivo aparte a propósito: no toca paymentRoutes.ts ni el flujo de los
 * agentes. Reutiliza `generatePaymentLinkFlow` tal como está.
 */

import { Router, Request, Response } from 'express';
import {
  generatePaymentLinkFlow,
  listarSuscripcionesPendientes,
  leerLinkData
} from '../services/paymentsWayService.js';
import {
  getClientById,
  getClientByDocument,
  searchClients,
  splitFullName,
  normalizeColombianPhone
} from '../functions/clientFunctions.js';
import {
  PRODUCTS,
  buildProductCharge,
  resolveProductKey,
  getProductKeys,
  getServiceTypes
} from '../config/products.js';

const router = Router();

/** Cliente ya resuelto, venga del listado o del formulario manual */
interface ResolvedClient {
  clientId: number | null;
  name: string;
  identification: string;
  email: string;
  phone: string;
  source: 'dentix_clients' | 'manual';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida los datos que digita el asesor cuando el cliente no está en el listado.
 * Es la única vía por la que entran datos sin pasar por la base, así que se valida
 * con cuidado: un email mal escrito significa que el cliente nunca recibe el link.
 */
const validateManualClient = (
  input: any
): { client: ResolvedClient } | { error: string; field: string } => {
  if (!input || typeof input !== 'object') {
    return { error: 'El objeto "client" es inválido', field: 'client' };
  }

  const name = String(input.name ?? '').trim();
  const identification = String(input.identification ?? '').replace(/\D/g, '');
  const email = String(input.email ?? '').trim().toLowerCase();
  const phone = normalizeColombianPhone(String(input.phone ?? ''));

  if (name.length < 3) {
    return { error: 'El nombre del cliente es obligatorio (mínimo 3 caracteres)', field: 'name' };
  }
  if (identification.length < 6 || identification.length > 12) {
    return { error: 'La cédula debe tener entre 6 y 12 dígitos', field: 'identification' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return {
      error: 'El correo no tiene un formato válido. Verifícalo con el cliente: es donde recibe el link.',
      field: 'email'
    };
  }
  if (!phone) {
    return { error: 'El celular debe tener 10 dígitos (ej. 3001234567)', field: 'phone' };
  }

  return { client: { clientId: null, name, identification, email, phone, source: 'manual' } };
};

/** Formatea una suscripción pendiente para la interfaz */
const formatSubscription = (sub: any) => {
  const linkData = leerLinkData(sub.link_data);
  return {
    id: sub.id,
    serviceType: sub.service_type,
    amount: sub.amount,
    description: sub.description,
    totalInstallments: sub.total_installments,
    paymentLink: linkData?.link_generado ?? null,
    shortLink: linkData?.link_corto ?? null,
    expiresAt: linkData?.fecha_vencimiento ?? null,
    updatedAt: linkData?.actualizado_en ?? null,
    createdAt: sub.created_at
  };
};

/**
 * Catálogo de productos, para poblar el selector de la interfaz.
 * GET /seguros-colte/products
 */
router.get('/seguros-colte/products', (_req: Request, res: Response) => {
  const products = getProductKeys().map(key => ({
    key,
    label: PRODUCTS[key].label,
    serviceType: PRODUCTS[key].serviceType,
    monthlyAmount: PRODUCTS[key].monthlyAmount,
    defaultInstallments: PRODUCTS[key].defaultInstallments,
    perUnit: PRODUCTS[key].perUnit,
    unitLabel: PRODUCTS[key].unitLabel ?? null,
    maxUnits: PRODUCTS[key].maxUnits ?? null
  }));

  res.status(200).json({ success: true, products });
});

/**
 * Buscador de clientes.
 * GET /seguros-colte/clients?q=<cédula | celular | nombre>
 */
router.get('/seguros-colte/clients', async (req: Request, res: Response) => {
  try {
    const term = String(req.query.q || '').trim();

    if (term.length < 3) {
      res.status(400).json({
        error: 'El término de búsqueda debe tener al menos 3 caracteres',
        hint: 'Busca por cédula, celular o nombre del cliente'
      });
      return;
    }

    const clients = await searchClients(term);
    const serviceTypes = getServiceTypes();

    // Adjuntamos los links pendientes de cada cliente: el asesor necesita saber si ya
    // le generó uno antes de crear otro.
    const enriched = await Promise.all(
      clients.map(async client => {
        const pending = client.document_id
          ? await listarSuscripcionesPendientes(client.document_id, serviceTypes)
          : [];
        return { ...client, pendingSubscriptions: pending.map(formatSubscription) };
      })
    );

    // Si no hay nadie en el listado y el término es una cédula, buscamos igual en
    // suscripciones: puede tener links previos generados manualmente.
    const digits = term.replace(/\D/g, '');
    let unregistered: any[] = [];

    if (enriched.length === 0 && /^\d{6,12}$/.test(digits)) {
      const pending = await listarSuscripcionesPendientes(digits, serviceTypes);
      unregistered = pending.map(formatSubscription);
    }

    res.status(200).json({
      success: true,
      count: enriched.length,
      clients: enriched,
      unregisteredPendingSubscriptions: unregistered,
      // Le indica a la interfaz que debe ofrecer el formulario manual
      allowManualEntry: enriched.length === 0
    });

  } catch (error: any) {
    console.error('❌ Error en /seguros-colte/clients:', error?.message);
    res.status(500).json({ error: 'Error buscando clientes', detail: error?.message });
  }
});

/**
 * Suscripciones pendientes de una cédula, sin depender de dentix_clients.
 * GET /seguros-colte/advisor/subscriptions?identification=1020304050
 */
router.get('/seguros-colte/advisor/subscriptions', async (req: Request, res: Response) => {
  try {
    const identification = String(req.query.identification || '').replace(/\D/g, '');

    if (identification.length < 6) {
      res.status(400).json({ error: 'Envía el parámetro identification con la cédula del cliente' });
      return;
    }

    const pending = await listarSuscripcionesPendientes(identification, getServiceTypes());

    res.status(200).json({
      success: true,
      identification,
      pendingSubscriptions: pending.map(formatSubscription)
    });

  } catch (error: any) {
    console.error('❌ Error en /advisor/subscriptions:', error?.message);
    res.status(500).json({ error: 'Error consultando suscripciones', detail: error?.message });
  }
});

/**
 * Creación de link de pago por parte del asesor.
 * POST /seguros-colte/advisor/create-link
 *
 * Body: { clientId | client, product, units?, totalInstallments?, advisorEmail }
 *
 * El asesor NO envía montos: salen del catálogo. Y si el cliente está en el listado,
 * tampoco envía sus datos: salen de dentix_clients.
 */
router.post('/seguros-colte/advisor/create-link', async (req: Request, res: Response) => {
  try {
    const { clientId, client: manualClient, product, units, totalInstallments, advisorEmail } = req.body || {};

    if (!product || !advisorEmail) {
      res.status(400).json({
        error: 'Faltan campos obligatorios',
        required: ['product', 'advisorEmail', 'clientId o client']
      });
      return;
    }

    if (!clientId && !manualClient) {
      res.status(400).json({
        error: 'Debes enviar clientId (cliente del listado) o client (datos manuales)',
        hint: 'Usa client cuando el cliente no aparece en la búsqueda'
      });
      return;
    }

    const productKey = resolveProductKey(String(product));
    if (!productKey) {
      res.status(400).json({ error: `Producto no válido: "${product}"`, allowed: getProductKeys() });
      return;
    }

    // 1. Resolver el cliente
    let resolved: ResolvedClient;

    if (clientId) {
      const client = await getClientById(Number(clientId));

      if (!client) {
        res.status(404).json({ error: `No existe un cliente con id ${clientId}` });
        return;
      }

      const missing: string[] = [];
      if (!client.email) missing.push('email');
      if (!client.document_id) missing.push('document_id');

      // El cliente existe pero está incompleto. No es un muro: la interfaz reenvía
      // con el objeto `client` completando lo que falta.
      if (missing.length > 0) {
        res.status(422).json({
          error: 'El cliente del listado tiene datos incompletos',
          missing,
          hint: 'Reenvía la solicitud con el objeto "client" completando estos campos',
          client: {
            id: client.id,
            name: client.name,
            email: client.email || null,
            document_id: client.document_id || null,
            phone_number: client.phone_number || null
          }
        });
        return;
      }

      resolved = {
        clientId: client.id ?? null,
        name: client.name,
        identification: client.document_id,
        email: client.email,
        phone: client.phone_number,
        source: 'dentix_clients'
      };
    } else {
      const validation = validateManualClient(manualClient);

      if ('error' in validation) {
        res.status(400).json({ error: validation.error, field: validation.field });
        return;
      }

      resolved = validation.client;

      // Si la cédula sí existe en el listado, amarramos la suscripción a ese registro
      // en lugar de dejarla con client_id null.
      const existing = await getClientByDocument(resolved.identification);

      if (existing?.id) {
        console.log(`🔗 La cédula ${resolved.identification} existe en dentix_clients (id ${existing.id}); se usa ese registro`);
        resolved = {
          ...resolved,
          clientId: existing.id,
          email: resolved.email || existing.email,
          phone: resolved.phone || existing.phone_number,
          source: 'dentix_clients'
        };
      }
    }

    // 2. Monto y descripción desde el catálogo
    let charge;
    try {
      charge = buildProductCharge(productKey, units ?? 1);
    } catch (chargeError: any) {
      res.status(400).json({ error: chargeError.message, field: 'units' });
      return;
    }

    // 3. ¿Ya tenía una suscripción pendiente de este producto? Solo para informar en la
    //    respuesta: el servicio la actualiza por su cuenta al recibir serviceType.
    const serviceType = PRODUCTS[productKey].serviceType;
    const previas = await listarSuscripcionesPendientes(resolved.identification, [serviceType]);

    const { firstname, lastname } = splitFullName(resolved.name);

    // 4. Generar el link
    const paymentLink = await generatePaymentLinkFlow({
      firstname,
      lastname,
      identification: resolved.identification,
      email: resolved.email,
      phone: resolved.phone,
      amount: charge.amount,
      description: charge.description,
      clientId: resolved.clientId,
      totalInstallments: totalInstallments || PRODUCTS[productKey].defaultInstallments,
      serviceType
    });

    console.log(`✅ Link generado por ${advisorEmail} para ${resolved.identification} (${productKey})`);

    res.status(200).json({
      success: true,
      paymentLink,
      product: {
        key: productKey,
        label: PRODUCTS[productKey].label,
        serviceType,
        units: charge.units
      },
      charge: {
        monthlyAmount: charge.amount,
        totalInstallments: totalInstallments || PRODUCTS[productKey].defaultInstallments,
        totalAmount: charge.amount * (totalInstallments || PRODUCTS[productKey].defaultInstallments)
      },
      client: {
        id: resolved.clientId,
        name: resolved.name,
        email: resolved.email,
        document_id: resolved.identification,
        phone_number: resolved.phone,
        source: resolved.source
      },
      // true cuando se reutilizó la suscripción que ya existía en lugar de crear otra
      reusedSubscription: previas.length > 0,
      reusedSubscriptionId: previas[0]?.id ?? null,
      warning: resolved.clientId
        ? null
        : 'El cliente no está en dentix_clients. La suscripción queda referenciada por cédula (client_id null), igual que exequias y hdi_seguro.'
    });

  } catch (error: any) {
    console.error('❌ Error en /advisor/create-link:', error?.message);
    res.status(500).json({
      error: 'No se pudo generar el link de pago',
      detail: error?.message || 'Error desconocido'
    });
  }
});

export default router;
