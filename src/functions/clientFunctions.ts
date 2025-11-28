import { supabase } from '../config/supabase';

export interface ClientData {
  name: string;
  email: string;
  document_id: string;
  phone_number: string;
  service?: string;
  product?: string;
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
      .select('name, email, document_id, phone_number, service, product')
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
    };
    
    if (!client) {
      console.log(`No se encontró cliente para el número: ${formattedNumber}`);
      return null;
    }
    
    console.log(`Cliente encontrado: ${client.name} (${client.email})`);
    
    return {
      name: client.name || 'Cliente',
      email: client.email || '',
      document_id: client.document_id || '',
      phone_number: client.phone_number || formattedNumber,
      service: client.service || undefined,
      product: client.product || undefined
    };
    
  } catch (error) {
    console.error('Excepción buscando cliente:', error);
    return null;
  }
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