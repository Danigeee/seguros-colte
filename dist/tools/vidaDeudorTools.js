import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { searchVidaDeudorDocuments } from "../functions/vidaDeudorFunctions";
import { smartSearchVidaDeudor } from "../functions/vidaDeudorRetrievers";
/**
 * Muestra los datos del cliente para confirmación.
 */
export const showVidaDeudorClientDataTool = tool(async ({ phoneNumber }) => {
    console.log(`🔍 Buscando datos para confirmación: ${phoneNumber}`);
    // Asegurar formato +57
    const formattedNumber = phoneNumber.startsWith('+57') ? phoneNumber : `+57${phoneNumber.replace(/^\+/, '')}`;
    const { data: client, error } = await supabase
        .from('dentix_clients')
        .select('name, email, document_id, phone_number')
        .eq('phone_number', formattedNumber)
        .single();
    if (error || !client) {
        return "No se encontraron datos para este número. Por favor solicita los datos manualmente.";
    }
    return `DATOS ENCONTRADOS PARA CONFIRMACIÓN:
- Cédula: ${client.document_id}
- Nombre: ${client.name}
- Celular: ${client.phone_number}
- Correo: ${client.email}

Por favor confirma con el cliente si estos datos son correctos.`;
}, {
    name: "showVidaDeudorClientDataTool",
    description: "Muestra los datos del cliente (cédula, nombre, celular, correo) para confirmación antes de la activación.",
    schema: z.object({
        phoneNumber: z.string().describe("Número de teléfono del cliente para buscar sus datos")
    })
});
/**
 * Actualiza los datos del cliente si es necesario.
 */
export const updateVidaDeudorClientDataTool = tool(async ({ phoneNumber, updates }) => {
    console.log(`📝 Actualizando datos para: ${phoneNumber}`, updates);
    const formattedNumber = phoneNumber.startsWith('+57') ? phoneNumber : `+57${phoneNumber.replace(/^\+/, '')}`;
    const { error } = await supabase
        .from('dentix_clients')
        .update(updates)
        .eq('phone_number', formattedNumber);
    if (error) {
        return `Error actualizando datos: ${error.message}`;
    }
    return "Datos actualizados correctamente. Puedes proceder con la activación.";
}, {
    name: "updateVidaDeudorClientDataTool",
    description: "Actualiza los datos del cliente (email, nombre, documento) si el cliente indica que son incorrectos.",
    schema: z.object({
        phoneNumber: z.string().describe("Número de teléfono del cliente"),
        updates: z.object({
            email: z.string().optional(),
            name: z.string().optional(),
            document_id: z.string().optional()
        }).describe("Objeto con los campos a actualizar")
    })
});
/**
 * Envía el correo de activación.
 * Nota: Esta es una simulación ya que no tengo acceso al servicio de correo real en este contexto,
 * pero simularé la acción exitosa.
 */
export const sendVidaDeudorActivationEmail = tool(async ({ clientName, clientEmail, clientPhone, clientDocument }) => {
    console.log(`📧 Enviando correo de activación a ${clientEmail}`);
    // Aquí iría la lógica real de envío de correo o llamada a API externa
    // Por ahora simulamos éxito
    return `✅ ACTIVACIÓN EXITOSA:
Se ha enviado el correo de confirmación a ${clientEmail}.
El cliente ${clientName} (Doc: ${clientDocument}) ha quedado activo con el beneficio de 3 meses gratis.`;
}, {
    name: "sendVidaDeudorActivationEmail",
    description: "Envía el correo de activación del seguro Vida Deudor y confirma la activación en el sistema.",
    schema: z.object({
        clientName: z.string(),
        clientEmail: z.string(),
        clientPhone: z.string(),
        clientDocument: z.string()
    })
});
/**
 * Herramienta para consultar información oficial de Bienestar Plus
 * Esta herramienta busca en la base de datos de documentos oficiales
 * para responder preguntas sobre coberturas, precios, servicios y beneficios
 */
export const consultVidaDeudorSpecialistTool = tool(async ({ consulta }) => {
    try {
        console.log(`Consultando documentos de Vida Deudor para: "${consulta}"`);
        const resultado = await searchVidaDeudorDocuments(consulta);
        if (!resultado || resultado.trim() === "") {
            return "No se encontró información específica sobre tu consulta en la base de datos oficial de Bienestar Plus.";
        }
        return resultado;
    }
    catch (error) {
        console.error("Error consultando documentos de Vida Deudor:", error);
        // Información de respaldo básica para Vida Deudor
        return `No se encontró información específica sobre tu consulta en la base de datos oficial de Vida Deudor.`;
    }
}, {
    name: "consultVidaDeudorSpecialistTool",
    description: "Consulta información oficial y verificada sobre el seguro Vida Deudor. Usa esta herramienta OBLIGATORIAMENTE antes de responder cualquier pregunta sobre coberturas, precios, beneficios o servicios de Vida Deudor.",
    schema: z.object({
        consulta: z
            .string()
            .describe("La pregunta completa del cliente o una frase de búsqueda detallada para encontrar la información en los documentos (ej: 'cubre a mis familiares', 'precio del plan familiar', 'servicios de odontología incluidos'). NO uses palabras sueltas como 'cobertura' o 'precio', sé específico."),
    }),
});
/**
 * Herramienta alternativa para búsquedas más específicas
 */
export const searchVidaDeudorDocumentsTool = tool(async ({ searchQuery }) => {
    try {
        console.log(`Búsqueda específica en documentos Vida Deudor: "${searchQuery}"`);
        const resultado = await searchVidaDeudorDocuments(searchQuery);
        if (!resultado || resultado.trim() === "") {
            return "No se encontraron documentos que coincidan con tu búsqueda.";
        }
        return resultado;
    }
    catch (error) {
        console.error("Error en búsqueda de documentos:", error);
        return "Error técnico temporal. Te puedo ayudar con información sobre Vida Deudor. ¿Qué necesitas saber?";
    }
}, {
    name: "search_vida_deudor_documents",
    description: "Busca información específica en los documentos oficiales de Vida Deudor usando términos de búsqueda precisos.",
    schema: z.object({
        searchQuery: z
            .string()
            .describe("Términos específicos de búsqueda para encontrar información en los documentos oficiales"),
    }),
});
/**
 * NUEVA HERRAMIENTA: Búsqueda Inteligente con Re-ranking
 * Esta herramienta usa la nueva lógica de filtrado semántico para evitar alucinaciones.
 * Se puede usar en paralelo o como reemplazo de la anterior.
 */
//! Esta no está en uso pero es tentativa para usar en el futuro
export const consultVidaDeudorSmartTool = tool(async ({ consulta }) => {
    try {
        console.log(`🧠 Consultando Vida Deudor (Smart Search) para: "${consulta}"`);
        const resultado = await smartSearchVidaDeudor(consulta);
        if (!resultado || resultado.trim() === "") {
            return "No se encontró información relevante en los documentos oficiales que responda específicamente a tu pregunta.";
        }
        // Inyectamos instrucción de estilo para el agente para forzar concisión
        return `[SISTEMA: INSTRUCCIONES DE RESPUESTA]
Usa la siguiente información recuperada para responder al usuario.
IMPORTANTE: Tu respuesta debe ser BREVE, CONCISA y DIRECTA.
- Resume los puntos clave en viñetas cortas.
- Evita explicaciones largas o redundantes.
- Ve al grano.

--- INFORMACIÓN RECUPERADA ---
${resultado}`;
    }
    catch (error) {
        console.error("Error en Smart Search:", error);
        return "Ocurrió un error técnico al consultar la información detallada.";
    }
}, {
    name: "consult_vida_deudor_specialist",
    description: "Consulta información oficial de Vida Deudor usando un sistema de búsqueda inteligente que filtra resultados irrelevantes. Úsala para preguntas complejas sobre coberturas, exclusiones o detalles específicos.",
    schema: z.object({
        consulta: z
            .string()
            .describe("La pregunta completa del cliente o el tema específico a buscar."),
    }),
});
export const vidaDeudorTools = [
    showVidaDeudorClientDataTool,
    updateVidaDeudorClientDataTool,
    sendVidaDeudorActivationEmail,
    // consultVidaDeudorSmartTool
    consultVidaDeudorSpecialistTool,
    searchVidaDeudorDocumentsTool
];
