import { AgentState } from "./agentState.js";
import { getClientByPhoneNumber, extractPhoneNumber, ClientData } from "../functions/clientFunctions.js";
import { SystemMessage } from "@langchain/core/messages";

/**
 * Nodo inicial que identifica al cliente por su número de teléfono
 * y enriquece el estado con la información del cliente
 */
export async function identifyClientNode(state: typeof AgentState.State, config?: any) {
  // ✅ OPTIMIZACIÓN: Solo identificar si no tenemos datos del cliente
  if (state.clientData) {
    console.log(`🔄 Cliente ya identificado: ${state.clientData.name} - Reutilizando datos`);
    return {
      clientData: state.clientData
    };
  }
  
  console.log('🔍 INICIANDO IDENTIFICACIÓN DE CLIENTE...');
  
  try {
    // Obtener el número de teléfono del contexto de configuración
    const userPhone = config?.configurable?.user_phone;
    
    if (!userPhone) {
      console.log('⚠️  No se encontró número de teléfono en la configuración');
      return {
        clientData: null
      };
    }
    
    console.log(`📱 Número de teléfono detectado: ${userPhone}`);
    
    // Extraer y formatear el número
    const formattedPhone = extractPhoneNumber(userPhone);
    console.log(`📱 Número formateado: ${formattedPhone}`);
    
    // Buscar el cliente en la base de datos
    const clientData = await getClientByPhoneNumber(formattedPhone);
    
    if (clientData) {
      console.log(`✅ Cliente identificado: ${clientData.name}`);
      console.log(`   Email: ${clientData.email}`);
      console.log(`   Documento: ${clientData.document_id}`);
      
      // Añadir mensaje de sistema con información del cliente
      const systemMessage = new SystemMessage(
        `INFORMACIÓN DEL CLIENTE IDENTIFICADO:
        - Nombre: ${clientData.name}
        - Email: ${clientData.email}
        - Documento ID: ${clientData.document_id}
        - Teléfono: ${clientData.phone_number}
        - Servicio: ${clientData.service || 'No especificado'}
        - Producto: ${clientData.product || 'No especificado'}

        INSTRUCCIONES:
        - Dirígete al cliente por su nombre (${clientData.name})
        - Tienes su email (${clientData.email}) para usar en sendPaymentLinkEmailTool
        - Personaliza la conversación conociendo su identidad`
      );
      
      return {
        clientData,
        messages: [systemMessage, ...(state.messages || [])]
      };
      
    } else {
      console.log(`ℹ️  Cliente no encontrado en la base de datos para: ${formattedPhone}`);
      
      const systemMessage = new SystemMessage(
        `CLIENTE NO IDENTIFICADO:
- Teléfono: ${formattedPhone}
- Cliente nuevo o no registrado en la base de datos
- Solicita información de contacto si necesitas enviar enlaces de pago`
      );
      
      return {
        clientData: null,
        messages: [systemMessage, ...(state.messages || [])]
      };
    }
    
  } catch (error) {
    console.error('❌ Error en identificación de cliente:', error);
    
    const systemMessage = new SystemMessage(
      `ERROR EN IDENTIFICACIÓN DE CLIENTE:
- No se pudo consultar la base de datos
- Trata al cliente de manera genérica
- Solicita información de contacto si es necesario`
    );
    
    return {
      clientData: null,
      messages: [systemMessage, ...(state.messages || [])]
    };
  }
}