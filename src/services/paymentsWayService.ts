import axios from 'axios';
import { supabase } from '../config/supabase.js';
import { notifySupervisorPaymentLink } from '../functions/sharedFunctions.js';
import { 
  CreatePersonRequest, 
  CreatePersonResponse, 
  CreatePaymentLinkRequest, 
  CreatePaymentLinkResponse,
  PaymentFlowRequest 
} from '../types/paymentsWay.js';

const PAYMENTS_WAY_CONFIG = {
  API_URL: process.env.PAYMENTS_WAY_API_URL || 'https://serviceregister.paymentsway.co/ClientAPI',
  TOKEN: process.env.PAYMENTS_WAY_TOKEN || '',
  TERMINAL_ID: 5248,
  FORM_ID: 6403,
  CURRENCY: 'COP',
  DEFAULT_SERVICE: 1, // CARD, PSE, CASH
  ID_TYPE_CC: "4" // Cédula de Ciudadanía
};

const apiClient = axios.create({
  baseURL: PAYMENTS_WAY_CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': PAYMENTS_WAY_CONFIG.TOKEN
  }
});

/**
 * Crea una persona en Payments Way
 */
export const createPerson = async (data: CreatePersonRequest): Promise<CreatePersonResponse> => {
  try {
    const response = await apiClient.post<CreatePersonResponse>('/CrearPersona', data);
    return response.data;
  } catch (error) {
    console.error('Error creating person in Payments Way:', );
    throw error;
  }
};

/**
 * Crea un link de pago en Payments Way
 */
export const createPaymentLink = async (data: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> => {
  try {
    const response = await apiClient.post<CreatePaymentLinkResponse>('/CrearLinkDePago', data);
    return response.data;
  } catch (error) {
    console.error('Error creating payment link in Payments Way:', );
    throw error;
  }
};

/**
 * Flujo completo: Crea persona y luego genera el link de pago
 */
export const generatePaymentLinkFlow = async (data: PaymentFlowRequest): Promise<string> => {
  try {
    // 1. Crear Persona
    const personData: CreatePersonRequest = {
      firstname: data.firstname,
      lastname: data.lastname,
      ididentificationtype: PAYMENTS_WAY_CONFIG.ID_TYPE_CC,
      identification: data.identification,
      email: data.email,
      phone: data.phone
    };

    const personResponse = await createPerson(personData);
    
    if (!personResponse || !personResponse.id) {
      throw new Error('Failed to create person: No ID returned');
    }

    // Calcular fecha de vencimiento (ej. mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaVencimiento = tomorrow.toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD

    // 2. Crear Link de Pago
    const linkData: CreatePaymentLinkRequest = {
      amount: data.amount,
      descripcion: data.description,
      currency: PAYMENTS_WAY_CONFIG.CURRENCY,
      terminal_id: PAYMENTS_WAY_CONFIG.TERMINAL_ID,
      id_form: PAYMENTS_WAY_CONFIG.FORM_ID,
      fecha_vencimiento: fechaVencimiento,
      status: true,
      services: [PAYMENTS_WAY_CONFIG.DEFAULT_SERVICE],
      idperson: Number(personResponse.id)
    };

    const linkResponse = await createPaymentLink(linkData);

    // 3. Registrar en la tabla suscripciones
    const { error: subscriptionError } = await supabase
      .from('suscripciones')
      .insert({
        client_id: data.clientId,
        payment_person_id: String(personResponse.id),
        identification_doc: data.identification,
        amount: data.amount,
        description: data.description,
        total_installments: data.totalInstallments || 12,
        status: 'pending_first_payment'
      });

    if (subscriptionError) {
      console.error('Error creating subscription record:');
      // No lanzamos error para no bloquear el retorno del link, pero lo logueamos
    }

    // Notificar al supervisor sobre el nuevo enlace de pago
    await notifySupervisorPaymentLink(data, linkResponse.linkgenerado);

    return linkResponse.linkgenerado; // O linkcorto si prefieres
  } catch (error) {
    console.error('Error in payment link generation flow:', );
    throw error;
  }
};
