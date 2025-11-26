import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { diagnoseTechnicalIssue, scheduleTechnicalVisit, getTechnicalManual, checkWarrantyStatus, schedulePreventiveMaintenance, } from "../functions/technicalFunctions";
// ==========================================
// HERRAMIENTAS TÉCNICAS
// ==========================================
/**
 * Herramienta para diagnosticar problemas técnicos
 */
export const diagnoseTechnicalIssueTool = tool(async (params) => {
    const diagnosis = diagnoseTechnicalIssue(params);
    return diagnosis;
}, {
    name: "diagnose_technical_issue",
    description: "Diagnostica problemas técnicos con productos y proporciona soluciones paso a paso basado en síntomas y palabras clave.",
    schema: z.object({
        issueDescription: z
            .string()
            .min(5)
            .describe("Descripción detallada del problema técnico"),
        productModel: z
            .string()
            .optional()
            .describe("Modelo específico del producto con problemas"),
        symptoms: z
            .array(z.string())
            .optional()
            .describe("Lista de síntomas adicionales observados"),
        urgency: z
            .enum(["baja", "media", "alta", "critica"])
            .optional()
            .default("media")
            .describe("Nivel de urgencia del problema"),
    }),
});
/**
 * Herramienta para programar visitas técnicas
 */
export const scheduleTechnicalVisitTool = tool(async (params) => {
    const visitSchedule = scheduleTechnicalVisit(params);
    return visitSchedule;
}, {
    name: "schedule_technical_visit",
    description: "Programa visitas técnicas para instalación, mantenimiento o reparación de equipos con técnicos especializados.",
    schema: z.object({
        customerName: z.string().min(2).describe("Nombre completo del cliente"),
        customerPhone: z
            .string()
            .min(10)
            .describe("Número de teléfono de contacto del cliente"),
        address: z
            .string()
            .min(10)
            .describe("Dirección completa donde se realizará el servicio"),
        serviceType: z
            .enum(["instalacion", "mantenimiento", "reparacion", "revision"])
            .describe("Tipo de servicio técnico requerido"),
        preferredDate: z
            .string()
            .optional()
            .describe("Fecha preferida para la visita (formato YYYY-MM-DD)"),
        urgency: z
            .enum(["baja", "media", "alta", "critica"])
            .optional()
            .default("media")
            .describe("Nivel de urgencia del servicio"),
        equipmentModel: z
            .string()
            .optional()
            .describe("Modelo específico del equipo a atender"),
        zone: z
            .string()
            .optional()
            .default("Bogotá")
            .describe("Zona o ciudad donde se encuentra el cliente"),
    }),
});
/**
 * Herramienta para obtener manuales técnicos
 */
export const getTechnicalManualTool = tool(async (params) => {
    const manual = getTechnicalManual(params);
    return manual;
}, {
    name: "get_technical_manual",
    description: "Obtiene información técnica detallada y manuales de productos específicos por modelo.",
    schema: z.object({
        productModel: z
            .string()
            .min(1)
            .describe("Modelo específico del producto (ej: PAN001, CAR001)"),
        manualType: z
            .enum(["instalacion", "operacion", "mantenimiento", "troubleshooting"])
            .optional()
            .default("operacion")
            .describe("Tipo de manual técnico requerido"),
        language: z
            .enum(["es", "en"])
            .optional()
            .default("es")
            .describe("Idioma del manual"),
    }),
});
/**
 * Herramienta para verificar estado de garantía
 */
export const checkWarrantyStatusTool = tool(async (params) => {
    const warrantyStatus = checkWarrantyStatus(params);
    return warrantyStatus;
}, {
    name: "check_warranty_status",
    description: "Verifica el estado de garantía de un producto, incluyendo vigencia, cobertura y próximos pasos.",
    schema: z.object({
        productId: z.string().min(1).describe("ID del producto a verificar"),
        serialNumber: z
            .string()
            .optional()
            .describe("Número de serie del equipo"),
        purchaseDate: z
            .string()
            .describe("Fecha de compra del producto (formato YYYY-MM-DD)"),
        category: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
        ])
            .optional()
            .describe("Categoría del producto para determinar período de garantía"),
    }),
});
/**
 * Herramienta para programar mantenimiento preventivo
 */
export const schedulePreventiveMaintenanceTool = tool(async (params) => {
    const maintenanceSchedule = schedulePreventiveMaintenance(params);
    return maintenanceSchedule;
}, {
    name: "schedule_preventive_maintenance",
    description: "Programa mantenimiento preventivo para equipos para extender su vida útil y prevenir fallas imprevistas.",
    schema: z.object({
        productId: z
            .string()
            .min(1)
            .describe("ID del producto que requiere mantenimiento"),
        customerName: z
            .string()
            .min(2)
            .describe("Nombre del cliente propietario del equipo"),
        lastMaintenanceDate: z
            .string()
            .optional()
            .describe("Fecha del último mantenimiento (formato YYYY-MM-DD)"),
        maintenanceType: z
            .enum(["preventivo", "correctivo", "predictivo"])
            .optional()
            .default("preventivo")
            .describe("Tipo de mantenimiento a programar"),
        zone: z
            .string()
            .optional()
            .default("Bogotá")
            .describe("Zona donde se encuentra el equipo"),
    }),
});
// ==========================================
// CONJUNTO DE HERRAMIENTAS TÉCNICAS
// ==========================================
export const technicalTools = [
    diagnoseTechnicalIssueTool,
    scheduleTechnicalVisitTool,
    getTechnicalManualTool,
    checkWarrantyStatusTool,
    schedulePreventiveMaintenanceTool,
];
