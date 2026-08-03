import { supabase } from '../config/supabase.js';

export interface ClientData {
  name: string;
  email: string;
  document_id: string;
  phone_number: string;
  service?: string;
  product?: string;
  id?: number;
}

/**
 * Busca información del cliente en la tabla dentix_clients por número de teléfono
 */
export async function getClientByPhoneNumber(phoneNumber: string): Promise<ClientData | null> {
  try {
    console.log(`Buscando cliente con número: ${phoneNumber}`);
    
    // Asegurar que el número tenga el formato correcto con +57
    const formattedNumber = phoneNumber.startsWith('+57') ? phoneNumber : `+57${phoneNumber.replace(/^\+/, '')}`;
    
    console.log(`Número formateado: ${formattedNumber}`);
    
    const { data, error } = await supabase
      .from('dentix_clients')
      .select('id, name, email, document_id, phone_number, service, product')
      .eq('phone_number', formattedNumber)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Cliente no encontrado para el número: ${formattedNumber}`);
        return null;
      }
      console.error('Error buscando cliente:', error);
      throw error;
    }
    
    // Casteamos explícitamente para evitar errores de inferencia de tipos si la definición de DB no está sincronizada
    const client = data as unknown as {
      name: string | null;
      email: string | null;
      document_id: string | null;
      phone_number: string | null;
      service: string | null;
      product: string | null;
      id: number | null;
    };
    
    if (!client) {
      console.log(`No se encontró cliente para el número: ${formattedNumber}`);
      return null;
    }
    
    console.log(`✅ Cliente encontrado: ${client.name} (${client.email}) - Servicio: ${client.service || 'No especificado'}`);
    
    return {
      name: client.name || 'Cliente',
      email: client.email || '',
      document_id: client.document_id || '',
      phone_number: client.phone_number || formattedNumber,
      service: client.service || undefined,
      product: client.product || undefined,
      id: client.id || undefined
    };
    
  } catch (error) {
    console.error('Excepción buscando cliente:', error);
    return null;
  }
}

const CLIENT_FIELDS = 'id, name, email, document_id, phone_number, service, product';

const mapClient = (row: any): ClientData => ({
  name: row.name || 'Cliente',
  email: row.email || '',
  document_id: row.document_id || '',
  phone_number: row.phone_number || '',
  service: row.service || undefined,
  product: row.product || undefined,
  id: row.id || undefined
});

/**
 * Busca un cliente por su id de dentix_clients. Usado por el flujo del asesor,
 * donde la interfaz ya seleccionó al cliente del buscador.
 */
export async function getClientById(clientId: number): Promise<ClientData | null> {
  const { data, error } = await supabase
    .from('dentix_clients')
    .select(CLIENT_FIELDS)
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    console.error('Error buscando cliente por id:', error.message);
    return null;
  }

  return data ? mapClient(data) : null;
}

/**
 * Busca un cliente por cédula. Se usa antes de aceptar datos manuales del asesor:
 * si el cliente sí existe pero lo buscó con otro formato de teléfono o el nombre mal
 * escrito, preferimos amarrar la suscripción a su registro real.
 */
export async function getClientByDocument(documentId: string): Promise<ClientData | null> {
  const { data, error } = await supabase
    .from('dentix_clients')
    .select(CLIENT_FIELDS)
    .eq('document_id', documentId.trim())
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error buscando cliente por documento:', error.message);
    return null;
  }

  return data ? mapClient(data) : null;
}

/**
 * Busca clientes por cédula, celular o nombre, para el buscador de la interfaz.
 * Devuelve varios resultados para que el asesor elija.
 */
export async function searchClients(term: string, limit: number = 10): Promise<ClientData[]> {
  const query = term.trim();
  if (!query) return [];

  const digits = query.replace(/\D/g, '');
  const esNumerico = digits.length > 0 && /^[\d+\s-]+$/.test(query);

  // El teléfono se guarda como +57XXXXXXXXXX; la cédula tal cual.
  const filtro = esNumerico
    ? [
        `document_id.eq.${digits}`,
        `phone_number.eq.+57${digits.replace(/^57/, '')}`,
        `phone_number.like.%${digits.replace(/^57/, '')}`
      ].join(',')
    : `name.ilike.%${query}%`;

  const { data, error } = await supabase
    .from('dentix_clients')
    .select(CLIENT_FIELDS)
    .or(filtro)
    .limit(limit);

  if (error) {
    console.error('Error buscando clientes:', error.message);
    return [];
  }

  return (data || []).map(mapClient);
}

/**
 * Payments Way exige firstname y lastname por separado, pero dentix_clients guarda el
 * nombre completo en un solo campo:
 *   "María Fernanda González" -> firstname: "María", lastname: "Fernanda González"
 */
export function splitFullName(fullName: string): { firstname: string; lastname: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstname: 'Cliente', lastname: 'Cliente' };
  if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] };

  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

/**
 * Normaliza un celular colombiano al formato +57XXXXXXXXXX de dentix_clients.
 * Devuelve null si no quedan 10 dígitos válidos.
 */
export function normalizeColombianPhone(phone: string): string | null {
  const national = (phone || '').replace(/\D/g, '').replace(/^57/, '');
  return national.length === 10 ? `+57${national}` : null;
}

/**
 * Extrae el número de teléfono de un mensaje de WhatsApp (formato: whatsapp:+573137249770)
 */
export function extractPhoneNumber(twilioFrom: string): string {
  // Remover el prefijo "whatsapp:" si existe
  const cleanNumber = twilioFrom.replace('whatsapp:', '');
  
  // Asegurar formato colombiano
  if (cleanNumber.startsWith('+57')) {
    return cleanNumber;
  } else if (cleanNumber.startsWith('57')) {
    return `+${cleanNumber}`;
  } else if (cleanNumber.startsWith('3')) {
    return `+57${cleanNumber}`;
  } else {
    return `+57${cleanNumber}`;
  }
}