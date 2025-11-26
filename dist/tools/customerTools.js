import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchFAQ, trackOrder, manageComplaint, getCompanyInfo, scheduleFollowUp, } from "../functions/customerFunctions";
// ==========================================
// HERRAMIENTAS DE SERVICIO AL CLIENTE
// ==========================================
/**
 * Herramienta para buscar en preguntas frecuentes
 */
export const searchFAQTool = tool(async (params) => {
    const faqResults = searchFAQ(params);
    return faqResults;
}, {
    name: "search_faq",
    description: "Busca respuestas en la base de conocimientos de preguntas frecuentes por categoría y palabras clave.",
    schema: z.object({
        query: z
            .string()
            .min(3)
            .describe("Pregunta o palabras clave a buscar en la base de conocimientos"),
        category: z
            .enum(["pagos", "logistica", "garantias", "instalacion", "todas"])
            .optional()
            .default("todas")
            .describe("Categoría específica para filtrar la búsqueda"),
    }),
});
/**
 * Herramienta para rastrear órdenes
 */
export const trackOrderTool = tool(async (params) => {
    const orderStatus = trackOrder(params);
    return orderStatus;
}, {
    name: "track_order",
    description: "Rastrea el estado de una orden y proporciona información detallada sobre envío e instalación.",
    schema: z.object({
        orderId: z
            .string()
            .min(1)
            .describe("ID de la orden a rastrear (ej: ORD-2024-001)"),
        customerInfo: z
            .string()
            .optional()
            .describe("Información adicional del cliente para verificación"),
    }),
});
/**
 * Herramienta para gestionar reclamos
 */
export const manageComplaintTool = tool(async (params) => {
    const complaintRecord = manageComplaint(params);
    return complaintRecord;
}, {
    name: "manage_complaint",
    description: "Gestiona reclamos de clientes creando casos de seguimiento con tiempos de resolución definidos.",
    schema: z.object({
        customerName: z
            .string()
            .min(2)
            .describe("Nombre completo del cliente que presenta el reclamo"),
        customerEmail: z
            .string()
            .email()
            .describe("Email de contacto del cliente"),
        complaintType: z
            .enum([
            "producto_defectuoso",
            "entrega_tardia",
            "servicio_tecnico",
            "facturacion",
            "otro",
        ])
            .describe("Tipo de reclamo del cliente"),
        description: z
            .string()
            .min(10)
            .describe("Descripción detallada del reclamo"),
        orderId: z
            .string()
            .optional()
            .describe("ID de la orden relacionada con el reclamo"),
        priority: z
            .enum(["baja", "media", "alta", "critica"])
            .optional()
            .default("media")
            .describe("Prioridad del reclamo"),
    }),
});
/**
 * Herramienta para obtener información de la empresa
 */
export const getCompanyInfoTool = tool(async (params) => {
    const companyInfo = getCompanyInfo(params.infoType);
    return companyInfo;
}, {
    name: "get_company_info",
    description: "Obtiene información general de InduEquipos Andina S.A.S. incluyendo contacto, productos y servicios.",
    schema: z.object({
        infoType: z
            .enum(["contacto", "productos", "general"])
            .optional()
            .describe("Tipo específico de información requerida. Si no se especifica, devuelve información completa"),
    }),
});
/**
 * Herramienta para programar llamadas de seguimiento
 */
export const scheduleFollowUpTool = tool(async (params) => {
    const followUpSchedule = scheduleFollowUp(params);
    return followUpSchedule;
}, {
    name: "schedule_follow_up",
    description: "Programa llamadas de seguimiento con clientes para verificar satisfacción o resolver consultas adicionales.",
    schema: z.object({
        customerName: z.string().min(2).describe("Nombre completo del cliente"),
        customerPhone: z
            .string()
            .min(10)
            .describe("Número de teléfono de contacto del cliente"),
        preferredDate: z
            .string()
            .optional()
            .describe("Fecha preferida para la llamada (formato YYYY-MM-DD)"),
        preferredTime: z
            .string()
            .optional()
            .default("10:00")
            .describe("Hora preferida para la llamada (formato HH:MM)"),
        reason: z
            .string()
            .min(5)
            .describe("Motivo o propósito de la llamada de seguimiento"),
        priority: z
            .enum(["baja", "media", "alta"])
            .optional()
            .default("media")
            .describe("Prioridad de la llamada de seguimiento"),
    }),
});
// ==========================================
// HERRAMIENTAS ADICIONALES DE SERVICIO
// ==========================================
/**
 * Herramienta para validar ciudad de cobertura
 */
export const validateCityTool = tool(async (params) => {
    // Importamos la función de validación de ciudad existente
    const { validateCity } = await import("../functions/functions");
    const cityValidation = validateCity(params.city);
    return cityValidation;
}, {
    name: "validate_city_coverage",
    description: "Valida si una ciudad está dentro de la cobertura de servicio de InduEquipos Andina S.A.S.",
    schema: z.object({
        city: z
            .string()
            .min(2)
            .describe("Nombre de la ciudad a validar para cobertura de servicio"),
    }),
});
/**
 * Herramienta para contacto de servicio al cliente
 */
export const contactServiceTool = tool(async () => {
    // Importamos la función de contacto existente
    const { contactCustomerService } = await import("../functions/functions");
    const contactInfo = contactCustomerService();
    return contactInfo;
}, {
    name: "get_contact_info",
    description: "Obtiene información de contacto especializada para ventas y servicios de InduEquipos Andina S.A.S.",
    schema: z.object({}),
});
// ==========================================
// CONJUNTO DE HERRAMIENTAS DE SERVICIO AL CLIENTE
// ==========================================
export const customerTools = [
    searchFAQTool,
    trackOrderTool,
    manageComplaintTool,
    getCompanyInfoTool,
    scheduleFollowUpTool,
    validateCityTool,
    contactServiceTool,
];
