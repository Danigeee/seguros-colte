import { getClientByPhoneNumber, extractPhoneNumber } from "../functions/clientFunctions.js";
import { SystemMessage } from "@langchain/core/messages";
/**
 * Nodo inicial que identifica al cliente por su número de teléfono
 * y enriquece el estado con la información del cliente
 */
export async function identifyClientNode(state, config) {
    // ✅ OPTIMIZACIÓN: si ya corrió en este thread (cliente encontrado, no encontrado o error),
    // no volver a consultar la DB ni añadir otro SystemMessage al historial.
    const yaIdentificado = state.messages?.some(msg => msg._getType() === 'system' && (String(msg.content).includes('INFORMACIÓN DEL CLIENTE IDENTIFICADO') ||
        String(msg.content).includes('CLIENTE NO IDENTIFICADO') ||
        String(msg.content).includes('ERROR EN IDENTIFICACIÓN')));
    if (yaIdentificado) {
        return {}; // No hacer nada — el SystemMessage ya está en el historial
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
        const origin = config?.configurable?.origin;
        const yaTienePensionadoCtx = state.messages?.some((msg) => msg._getType() === 'system' &&
            String(msg.content).includes('CONTEXTO PENSIONADO ELEVENLABS'));
        if (clientData) {
            console.log(`✅ Cliente identificado: ${clientData.name}`);
            console.log(`  Email: ${clientData.email}`);
            console.log(`   Documento: ${clientData.document_id}`);
            console.log(`   ID: ${clientData.id}`);
            // Añadir mensaje de sistema con información del cliente
            const systemMessage = new SystemMessage(`INFORMACIÓN DEL CLIENTE IDENTIFICADO:
        - Nombre: ${clientData.name}
        - Email: ${clientData.email}
        - Documento ID: ${clientData.document_id}
        - Teléfono: ${clientData.phone_number}
        - Servicio: ${clientData.service || 'No especificado'}
        - Producto: ${clientData.product || 'No especificado'}
        - ID: ${clientData.id}

        INSTRUCCIONES:
        - Dirígete al cliente por su nombre (${clientData.name})
        - Tienes su email (${clientData.email}) para usar en sendPaymentLinkEmailTool
        - Personaliza la conversación conociendo su identidad`);
            const mensajesARetornar = [systemMessage];
            let clientDataFinal = clientData;
            if (origin === 'elevenlabs_pensionado' && !yaTienePensionadoCtx) {
                console.log('🎙️  Origen ElevenLabs detectado: inyectando contexto pensionado');
                mensajesARetornar.push(new SystemMessage(`CONTEXTO PENSIONADO ELEVENLABS:
- El cliente fue contactado por el agente de voz ElevenLabs y CONFIRMÓ ser PENSIONADO.
- NO vuelvas a preguntarle si es pensionado. Ya lo confirmó en la llamada.
- Salúdalo cálidamente, menciona que continúas el proceso iniciado por teléfono.
- Primera pregunta obligatoria: "¿A qué fondo de pensión perteneces? Las opciones son: Casur, Cremil o Fiduprevisora."`));
                if (!clientData.service) {
                    clientDataFinal = { ...clientData, service: 'Bienestar Plus' };
                }
            }
            return {
                clientData: clientDataFinal,
                messages: mensajesARetornar
            };
        }
        else {
            console.log(`ℹ️  Cliente no encontrado en la base de datos para: ${formattedPhone}`);
            const systemMessage = new SystemMessage(`CLIENTE NO IDENTIFICADO:
- Teléfono: ${formattedPhone}
- Cliente nuevo o no registrado en la base de datos
- Solicita información de contacto si necesitas enviar enlaces de pago`);
            const mensajesARetornar = [systemMessage];
            if (origin === 'elevenlabs_pensionado' && !yaTienePensionadoCtx) {
                console.log('🎙️  Origen ElevenLabs detectado (cliente no en DB): inyectando contexto pensionado');
                mensajesARetornar.push(new SystemMessage(`CONTEXTO PENSIONADO ELEVENLABS:
- El cliente fue contactado por el agente de voz ElevenLabs y CONFIRMÓ ser PENSIONADO.
- NO vuelvas a preguntarle si es pensionado. Ya lo confirmó en la llamada.
- Salúdalo cálidamente, menciona que continúas el proceso iniciado por teléfono.
- Primera pregunta obligatoria: "¿A qué fondo de pensión perteneces? Las opciones son: Casur, Cremil o Fiduprevisora."`));
                // Stub de clientData para forzar routing determinístico a bienestar_plus_advisor
                return {
                    clientData: {
                        name: 'Pensionado',
                        email: null,
                        document_id: null,
                        phone_number: formattedPhone,
                        service: 'Bienestar Plus',
                        product: null,
                        id: 0
                    },
                    messages: mensajesARetornar
                };
            }
            return {
                clientData: null,
                messages: mensajesARetornar
            };
        }
    }
    catch (error) {
        console.error('❌ Error en identificación de cliente:', error);
        const systemMessage = new SystemMessage(`ERROR EN IDENTIFICACIÓN DE CLIENTE:
- No se pudo consultar la base de datos
- Trata al cliente de manera genérica
- Solicita información de contacto si es necesario`);
        return {
            clientData: null,
            messages: [systemMessage]
        };
    }
}
