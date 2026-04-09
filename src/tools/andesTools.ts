import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { pdfBase64Store } from './generarPdfBase64Tool.js';
import { Resend } from 'resend';

const BASE_URL = process.env.BACKEND_ANDES_URL;

/**
 * Helper: fetch con AbortController para evitar cuelgues indefinidos
 * cuando el backend de Andes no responde.
 */
function fetchConTimeout(url: string, options: RequestInit, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Verifica si el servicio SOAP de Andes está disponible.
 */
export const verificarEstadoAndes = tool(
  async () => {
    try {
      console.log('[AndesTools] verificar_estado_andes → llamando backend...');
      const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/test-connection`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[AndesTools] verificar_estado_andes → respuesta OK');
      return data;
    } catch (e: any) {
      console.error('[AndesTools] verificar_estado_andes → ERROR:', e.message);
      return { error: true, mensaje: `No se pudo conectar al backend: ${e.message}` };
    }
  },
  {
    name: 'verificar_estado_andes',
    description: `Verifica si el servicio SOAP de Andes está disponible y operativo.
    Úsala antes de iniciar cualquier flujo de firma electrónica para confirmar conectividad.
    No requiere ningún parámetro. Si retorna error, no continúes con el flujo de firma.`,
    schema: z.object({})
  }
);

/**
 * Paso 1 del flujo de firma: solicita certificado y genera OTP al firmante.
 */
export const solicitarCertificado = tool(
  async (input) => {
    try {
      // idTipoDocumento SIEMPRE = 1 (CC). No lo exponemos en el schema para evitar que el
      // agente pase un valor incorrecto y genere un certificado con tipo distinto al que
      // luego usará firmar_documento (lo que causaba error 121 — cert de tipo 2 vs lookup tipo 1).
      const payload = { datosFirmante: { ...input, idTipoDocumento: 1 } };
      console.log('[AndesTools] solicitar_certificado → payload:', JSON.stringify(payload, null, 2));
      const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/solicitar-firma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const rawText = await res.text();
      console.log('[AndesTools] solicitar_certificado → HTTP status:', res.status);
      console.log('[AndesTools] solicitar_certificado → respuesta raw:', rawText);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${rawText}`);
      const data = JSON.parse(rawText);
      console.log('[AndesTools] solicitar_certificado → data parseada:', JSON.stringify(data, null, 2));
      return data;
    } catch (e: any) {
      console.error('[AndesTools] solicitar_certificado → ERROR:', e.message);
      return { error: true, mensaje: `Error al solicitar certificado: ${e.message}` };
    }
  },
  {
    name: 'solicitar_certificado',
    description: `Paso 1 del flujo de firma electrónica con Andes.
    Solicita un certificado digital y genera un código OTP que se envía al firmante por SMS o email.
    Llama esta tool ANTES de firmar el documento — es obligatoria para obtener el OTP.
    Guarda el resultado porque puede contener un ID de solicitud necesario para pasos posteriores.`,
    schema: z.object({
      documento:       z.string().describe('Número de documento de identidad del firmante'),
      primerNombre:    z.string().describe('Primer nombre del firmante'),
      primerApellido:  z.string().describe('Primer apellido del firmante'),
      correo:          z.string().describe('Correo electrónico del firmante'),
      celular:         z.string().describe('Número de celular para recibir el OTP'),
      segundoNombre:   z.string().default('').describe('Segundo nombre del firmante (opcional)'),
      segundoApellido: z.string().default('').describe('Segundo apellido del firmante (opcional)'),
      notificacion:    z.number().default(1).describe('Canal de envío del OTP: 1=Email, 2=SMS')
    })
  }
);

/**
 * Paso 2 del flujo de firma: firma el PDF con el OTP recibido.
 * El campo documentoBase64 acepta el pdfKey retornado por generarPdfBase64Tool.
 * El Base64 real se resuelve automáticamente desde el store servidor-side.
 */
export const firmarDocumento = tool(
  async (input) => {
    try {
      // Resolver el PDF desde el store.
      // Si se pasa 'pdfKey' explícita (flujo multi-documento), se usa directamente.
      // Si no, se usa la clave por defecto pdf_{documento} (flujo de un solo PDF).
      const { codigoOTP, documento, pdfKey: pdfKeyExplicita, nombreAdjunto, firmaVisible, coordenadasFirma, pagina, observaciones, tipoFirmaVis, imagenFirma } = input as any;
      const idTipoDocumento = 1; // Siempre CC=1, consistente con solicitar_certificado
      const storeKey = pdfKeyExplicita ?? `pdf_${documento}`;
      console.log(`[AndesTools] firmar_documento → storeKey: "${storeKey}" | pdfKey explícita: ${pdfKeyExplicita ?? 'NINGUNA (default)'}`);
      const documentoBase64 = pdfBase64Store.get(storeKey);
      if (!documentoBase64) {
        // Ayuda de diagnóstico: listar claves disponibles para este documento
        const availableKeys = Array.from(pdfBase64Store.keys()).filter(k => k.includes(documento));
        console.warn(`[AndesTools] firmar_documento → PDF no encontrado. Claves disponibles para doc ${documento}:`, availableKeys);
        return { error: true, mensaje: `PDF no encontrado en el store para la clave '${storeKey}'. ${availableKeys.length > 0 ? `Claves disponibles: ${availableKeys.join(', ')} — debes pasar 'pdfKey' explícitamente.` : 'Ejecuta generarPdfsFondoTool primero.'}` };
      }
      console.log('[AndesTools] firmar_documento → PDF resuelto desde store para documento:', documento);
      const payload = {
        documentoBase64,
        codigoOTP,
        datosFirmante: { documento, idTipoDocumento, nombreAdjunto, firmaVisible, coordenadasFirma, pagina, observaciones, tipoFirmaVis, imagenFirma }
      };
      console.log('[AndesTools] firmar_documento → payload (sin base64):', JSON.stringify({ codigoOTP, datosFirmante: payload.datosFirmante }));
      const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/confirmar-firma-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 30_000); // 30s — la firma puede tardar más que otras operaciones
      const rawText = await res.text();
      if (!res.ok) {
        console.error(`[AndesTools] firmar_documento → ERROR storeKey: "${storeKey}" | body:`, rawText);
        let errorData: any = {};
        try { errorData = JSON.parse(rawText); } catch {}
        if (errorData?.estadoAndes === 121) {
          // Certificado expirado — pedir nuevo OTP, NO regenerar PDF
          return { error: true, estadoAndes: 121, mensaje: 'El certificado OTP expiró (5 min). Llama a solicitar_certificado con los mismos datos del cliente, luego espera el nuevo OTP del cliente. NO regeneres el PDF.' };
        }
        if (errorData?.estadoAndes === 142) {
          // OTP inválido — NO llamar solicitar_certificado automáticamente (crearía nuevo OTP e invalidaría el actual)
          return { error: true, estadoAndes: 142, mensaje: 'El código OTP no es válido (estadoAndes 142). Dile al cliente: "El código que ingresaste no es válido. Por favor revisa el correo más reciente de Andes SCD y escríbeme exactamente el código que aparece ahí." NO llames a solicitar_certificado — eso invalidaría el código actual.' };
        }
        if (errorData?.estadoAndes === 144) {
          // PDF inválido — el archivo enviado no es un PDF válido. Error de datos, NO de OTP.
          return { error: true, estadoAndes: 144, mensaje: `El documento enviado no es un PDF válido según Andes (estadoAndes 144). Esto indica un problema con el archivo generado. NO llames a solicitar_certificado ni vuelvas a llamar firmar_documento. Informa al cliente que hubo un error técnico y detente.` };
        }
        throw new Error(`HTTP ${res.status}: ${rawText}`);
      }
      const data = JSON.parse(rawText);
      console.log('[AndesTools] firmar_documento → respuesta OK:', JSON.stringify({ estado: data?.data?.estado, id: data?.data?.id }));
      // Guardar el PDF firmado (con firma embebida) para adjuntarlo en el correo al cliente
      // El signed PDF viene en data.data.mensaje (andesService → andesController → { success, data: { estado, mensaje, id } })
      const signedPdfBase64 = data?.data?.mensaje;
      const andesId = data?.data?.id;
      if (signedPdfBase64 && andesId) {
        // Clave = signed_andes_{id} para que descargar_todos_certificados pueda
        // buscarla por el mismo id, sin depender del orden de inserción en el store.
        pdfBase64Store.set(`signed_andes_${andesId}`, signedPdfBase64);
      }
      // Eliminar el PDF de firma del store (ya no se necesita)
      pdfBase64Store.delete(storeKey);
      // Omitir el campo 'mensaje' del retorno para no saturar el contexto del LLM
      return { success: data.success, data: { estado: data?.data?.estado, id: data?.data?.id }, mensajeFirma: 'Documento firmado exitosamente. Procede a ejecutar descargar_certificado con el id obtenido.' };
    } catch (e: any) {
      console.error('[AndesTools] firmar_documento → ERROR:', e.message);
      return { error: true, mensaje: `Error al firmar documento: ${e.message}` };
    }
  },
  {
    name: 'firmar_documento',
    description: `Paso 2 del flujo de firma electrónica con Andes. Úsala cuando el cliente te envíe su código OTP.
    Firma el PDF con el OTP recibido. El PDF se resuelve automáticamente desde el store — NO necesitas pasar documentoBase64.
    Para firmar UN solo documento (flujo simple): omite 'pdfKey', se resuelve automáticamente con pdf_{documento}.
    Para firmar MÚLTIPLES documentos (flujo pensión con fondo): pasa el campo 'pdfKey' exacto retornado por generarPdfsFondoTool y llama esta tool UNA VEZ POR CADA documento de la lista, usando el MISMO codigoOTP en todas.
    REQUIERE haber llamado previamente a generarPdfsFondoTool (o generarPdfBase64Tool) y a solicitar_certificado.
    Retorna un ID de solicitud (data.id) para usar en descargar_certificado o descargar_todos_certificados.`,
    schema: z.object({
      documento:        z.string().describe('Número de documento de identidad del firmante'),
      codigoOTP:        z.string().describe('Código OTP recibido por el firmante en su correo'),
      pdfKey:           z.string().optional().describe('Clave exacta del PDF en el store (retornada por generarPdfsFondoTool). Si se omite, se usa pdf_{documento}. Obligatorio en el flujo multi-documento.'),
      nombreAdjunto:    z.string().default('documento_firmado').describe('Nombre del archivo resultante (sin extensión)'),
      firmaVisible:     z.string().default('1').describe('Visibilidad de la firma: 1=visible, 2=no visible'),
      coordenadasFirma: z.string().default('80,20,150,60').describe('Posición de la firma en el PDF: x,y,ancho,alto'),
      pagina:           z.number().default(0).describe('Página donde se coloca la firma. 0=última página'),
      observaciones:    z.string().default('Firma electrónica').describe('Texto de observaciones que acompaña la firma'),
      tipoFirmaVis:     z.number().default(1).describe('Estilo visual de la firma: 1=estándar'),
      imagenFirma:      z.string().default('').describe('Imagen personalizada de firma en Base64 (dejar vacío para firma estándar)')
    })
  }
);

/**
 * Descarga el certificado resultante de una firma ya procesada y lo envía por correo al cliente.
 */
export const descargarCertificado = tool(
  async ({ idSolicitud, correoCliente, nombreCliente, numeroIdentificacion, telefono }) => {
    try {
      console.log('[AndesTools] descargar_certificado → llamando backend con idSolicitud:', idSolicitud);
      const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/testigo/${idSolicitud}`, {
        method: 'GET'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[AndesTools] descargar_certificado → respuesta OK');

      // Log de la estructura real de la respuesta de Andes para diagnóstico
      const responseKeys = Object.keys(data || {});
      console.log('[AndesTools] descargar_certificado → campos en respuesta:', responseKeys);
      console.log('[AndesTools] descargar_certificado → data.success:', data?.success, '| data.mensaje length:', data?.mensaje?.length ?? 'N/A');

      // testigoBase64 = documento original con la firma OTP ya embebida (el documento final)
      const pdfBase64 = data?.testigoBase64;
      // Limpiar el original sin firma del store (ya no se necesita)
      const originalPdfStoreKey = Array.from(pdfBase64Store.keys()).find(k => k.startsWith('original_pdf_'));
      if (originalPdfStoreKey) pdfBase64Store.delete(originalPdfStoreKey);

      if (pdfBase64 && correoCliente) {
        try {
          const attachments: { content: string; filename: string }[] = [
            { content: pdfBase64, filename: 'Solicitud_Bienestar_Plus_Protegido_firmado.pdf' }
          ];
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { error: resendError } = await resend.emails.send({
            from: 'notificaciones@asistenciacoltefinanciera.com',
            to: correoCliente,
            subject: 'Tu documento Bienestar Plus Protegido firmado electrónicamente',
            html: `<p>Hola <strong>${nombreCliente}</strong>,</p><p>Adjunto encontrarás tu documento de solicitud <strong>Bienestar Plus Protegido</strong> con la firma electrónica aplicada.</p><p>Gracias por tu preferencia.</p><p>Coltefinanciera Seguros</p>`,
            attachments
          });
          if (resendError) {
            console.error('[AndesTools] descargar_certificado → Error Resend:', resendError);
            return { success: true, emailError: true, mensaje: `Documento firmado obtenido, pero error al enviar correo a ${correoCliente}: ${JSON.stringify(resendError)}` };
          }
          console.log(`[AndesTools] descargar_certificado → Email enviado a ${correoCliente}`);

          // Copia interna con datos del usuario
          const { error: copyError } = await resend.emails.send({
            from: "notificaciones@asistenciacoltefinanciera.com",
            // to: "legal@ultimmarketing.com",
            to: "alejandro.b@ultimmarketing.com",
            // cc: ["alejandro.b@ultimmarketing.com"],
            subject: `Documento firmado OTP - ${nombreCliente}`,
            html: `<p>Este es un documento de firma OTP del usuario <strong>${nombreCliente}</strong>, con número de cédula <strong>${numeroIdentificacion}</strong>, número de teléfono <strong>${telefono}</strong> y email <strong>${correoCliente}</strong>.</p>`,
            attachments: [
              {
                content: pdfBase64,
                filename: "Solicitud_Bienestar_Plus_Protegido_firmado.pdf",
              },
            ],
          });
          if (copyError) console.error('[AndesTools] descargar_certificado → Error copia interna:', copyError);
          else console.log('[AndesTools] descargar_certificado → Copia interna enviada a legal@ultimmarketing.com');

          return { success: true, mensaje: `Documento firmado enviado exitosamente al correo ${correoCliente}.` };
        } catch (emailErr: any) {
          console.error('[AndesTools] descargar_certificado → Excepción enviando email:', emailErr.message);
          return { success: true, emailError: true, mensaje: `Documento firmado obtenido, pero no se pudo enviar el correo a ${correoCliente}: ${emailErr.message}` };
        }
      }

      // Si no hay correo o PDF, retornar sin base64 para no inflar el contexto
      console.warn('[AndesTools] descargar_certificado → pdfBase64 vacío o sin correoCliente. pdfBase64 presente:', !!pdfBase64, '| correoCliente:', correoCliente);
      return { success: !!pdfBase64, mensaje: pdfBase64 ? 'Documento firmado obtenido correctamente.' : 'No se encontró el documento firmado en la respuesta de Andes.' };
    } catch (e: any) {
      console.error('[AndesTools] descargar_certificado → ERROR:', e.message);
      return { error: true, mensaje: `Error al descargar certificado: ${e.message}` };
    }
  },
  {
    name: 'descargar_certificado',
    description: `Descarga el certificado digital resultante de una firma ya procesada por Andes y lo envía por correo electrónico al cliente.
    Úsala después de firmar_documento para obtener y entregar el comprobante oficial de la firma.
    Requiere el ID de solicitud retornado por firmar_documento, el correo y el nombre del cliente.`,
    schema: z.object({
      idSolicitud:          z.string().describe('ID de solicitud retornado por la tool firmar_documento (campo data.id)'),
      correoCliente:        z.string().describe('Correo electrónico del cliente donde se enviará el documento firmado'),
      nombreCliente:        z.string().describe('Nombre completo del cliente'),
      numeroIdentificacion: z.string().describe('Número de cédula o documento del cliente'),
      telefono:             z.string().describe('Número de teléfono del cliente')
    })
  }
);

/**
 * Descarga múltiples certificados firmados en una sola operación y los envía al cliente
 * como adjuntos en un único correo. Usada en el flujo de pensionados con múltiples documentos.
 */
export const descargarTodosCertificados = tool(
  async ({ solicitudes, correoCliente, nombreCliente, numeroIdentificacion, telefono }) => {
    try {
      console.log(`[AndesTools] descargar_todos_certificados → descargando ${solicitudes.length} certificado(s)...`);

      // PDFs firmados (con firma embebida) guardados durante firmar_documento
      const signedAttachments: { content: string; filename: string }[] = [];
      // Certificados Andes (testigoBase64) — acreditan el evento de firma
      const testigoAttachments: { content: string; filename: string }[] = [];

      for (const { idSolicitud, nombreArchivo } of solicitudes) {
        // PDF firmado desde el store (guardado en firmar_documento como signed_andes_{id})
        const signedKey = `signed_andes_${idSolicitud}`;
        const signedPdf = pdfBase64Store.get(signedKey);
        if (signedPdf) {
          signedAttachments.push({ content: signedPdf, filename: nombreArchivo });
          pdfBase64Store.delete(signedKey);
          console.log(`[AndesTools] descargar_todos_certificados → PDF firmado desde store: ${nombreArchivo} (id: ${idSolicitud})`);
        } else {
          console.warn(`[AndesTools] descargar_todos_certificados → signed_andes_${idSolicitud} no encontrado en store`);
        }

        // Certificado Andes (testigo)
        console.log(`[AndesTools] descargar_todos_certificados → testigo para idSolicitud: ${idSolicitud}`);
        const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/testigo/${idSolicitud}`, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status} para idSolicitud ${idSolicitud}`);
        const data = await res.json();
        const testigoBase64 = data?.testigoBase64;
        if (testigoBase64) {
          testigoAttachments.push({ content: testigoBase64, filename: `CERTIFICADO_${nombreArchivo}` });
          console.log(`[AndesTools] descargar_todos_certificados → Certificado Andes OK: ${nombreArchivo}`);
        } else {
          console.warn(`[AndesTools] descargar_todos_certificados → testigoBase64 vacío para ${idSolicitud}`);
        }
      }

      // Limpiar cualquier clave signed_andes_* remanente (p.ej. si el agente omitió alguna)
      for (const key of Array.from(pdfBase64Store.keys())) {
        if (key.startsWith('signed_andes_') || key.startsWith(`original_pdf_${numeroIdentificacion}`)) {
          pdfBase64Store.delete(key);
        }
      }

      const clientAttachments = signedAttachments.length > 0 ? signedAttachments : testigoAttachments;
      if (clientAttachments.length === 0) {
        return { success: false, mensaje: 'No se pudieron obtener los documentos firmados.' };
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      // Correo al cliente: PDFs con firma embebida (o certificados si no hay firmados)
      const { error: clienteError } = await resend.emails.send({
        from: 'notificaciones@asistenciacoltefinanciera.com',
        to: correoCliente,
        subject: 'Tus documentos Bienestar Plus Protegido firmados electrónicamente',
        html: `<p>Hola <strong>${nombreCliente}</strong>,</p><p>Adjunto encontrarás tus documentos de solicitud <strong>Bienestar Plus Protegido</strong> con la firma electrónica aplicada.</p><p>Gracias por tu preferencia.</p><p>Coltefinanciera Seguros</p>`,
        attachments: clientAttachments,
      });

      if (clienteError) {
        console.error('[AndesTools] descargar_todos_certificados → Error Resend (cliente):', clienteError);
        return { success: true, emailError: true, mensaje: `Documentos firmados obtenidos pero error al enviar correo a ${correoCliente}: ${JSON.stringify(clienteError)}` };
      }
      console.log(`[AndesTools] descargar_todos_certificados → Email enviado a ${correoCliente} con ${clientAttachments.length} adjunto(s)`);

      // Copia interna: PDFs firmados + certificados Andes
      const internalAttachments = [...signedAttachments, ...testigoAttachments];

      const { error: copyError } = await resend.emails.send({
        from: 'notificaciones@asistenciacoltefinanciera.com',
        // to: 'legal@ultimmarketing.com',
        to: 'alejandro.b@ultimmarketing.com',
        subject: `Documentos firmados OTP - ${nombreCliente}`,
        html: `<p>Documentos de firma OTP del usuario <strong>${nombreCliente}</strong>, cédula <strong>${numeroIdentificacion}</strong>, teléfono <strong>${telefono}</strong>, email <strong>${correoCliente}</strong>.</p>`,
        attachments: internalAttachments,
      });
      if (copyError) console.error('[AndesTools] descargar_todos_certificados → Error copia interna:', copyError);
      else console.log(`[AndesTools] descargar_todos_certificados → Copia interna enviada a legal@ultimmarketing.com con ${internalAttachments.length} adjunto(s)`);

      return {
        success: true,
        mensaje: `${clientAttachments.length} documento(s) firmado(s) enviados exitosamente al correo ${correoCliente}.`,
      };
    } catch (e: any) {
      console.error('[AndesTools] descargar_todos_certificados → ERROR:', e.message);
      return { error: true, mensaje: `Error al descargar certificados: ${e.message}` };
    }
  },
  {
    name: 'descargar_todos_certificados',
    description: `Descarga TODOS los certificados firmados de un flujo multi-documento (pensionados con fondo) y los envía en un único correo al cliente.
    Úsala DESPUÉS de haber llamado firmar_documento para CADA documento de la lista retornada por generarPdfsFondoTool.
    Recibe la lista de IDs de solicitud (uno por documento firmado) y los datos del cliente.`,
    schema: z.object({
      solicitudes: z.array(
        z.object({
          idSolicitud:   z.string().describe('ID de solicitud retornado por firmar_documento (campo data.id)'),
          nombreArchivo: z.string().describe('Nombre del archivo firmado, ej: "Solicitud_Bienestar_Plus_Protegido_firmado.pdf"'),
        })
      ).describe('Lista de IDs de solicitud con sus nombres de archivo, uno por cada documento firmado'),
      correoCliente:        z.string().describe('Correo electrónico del cliente'),
      nombreCliente:        z.string().describe('Nombre completo del cliente'),
      numeroIdentificacion: z.string().describe('Número de cédula o documento del cliente'),
      telefono:             z.string().describe('Número de teléfono del cliente'),
    }),
  }
);

export const andesTools = [
  verificarEstadoAndes,
  solicitarCertificado,
  firmarDocumento,
  descargarCertificado,
  descargarTodosCertificados,
];
