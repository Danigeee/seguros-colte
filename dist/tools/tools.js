import dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { contactCustomerService, getProductInfo, troubleshootIssue, validateCity, } from "../functions/functions";
dotenv.config();
// ==========================================
// HERRAMIENTAS GENERALES (LEGACY)
// ==========================================
/**
 * Herramienta para obtener información de contacto
 */
export const contactTool = tool(async () => {
    const contact = contactCustomerService();
    return contact;
}, {
    name: "contacto_servicio_cliente",
    description: "Brinda el canal de contacto para ventas y servicios de InduEquipos Andina S.A.S.",
    schema: z.object({}),
});
/**
 * Herramienta para obtener información de productos específicos
 */
export const getProductInfoTool = tool(async ({ product }) => {
    const productInfo = getProductInfo(product);
    return productInfo;
}, {
    name: "get_product_info",
    description: "Obtiene información sobre un producto específico de InduEquipos Andina S.A.S. Usa esta herramienta solo cuando el cliente pregunte por un producto específico.",
    schema: z.object({
        product: z
            .union([
            z.literal("cámara"),
            z.literal("alarma"),
            z.literal("cerca eléctrica"),
        ])
            .describe("Producto específico a consultar"),
    }),
});
/**
 * Herramienta para solucionar problemas técnicos
 */
export const troubleshootIssueTool = tool(async ({ issue }) => {
    const diagnostic = troubleshootIssue(issue);
    return diagnostic;
}, {
    name: "troubleshoot_issue",
    description: "Brinda soluciones a problemas comunes con los productos de InduEquipos Andina S.A.S.",
    schema: z.object({
        issue: z.string().min(5).describe("Descripción del problema técnico"),
    }),
});
/**
 * Herramienta para validar cobertura de ciudad
 */
export const validateCityTool = tool(async ({ city }) => {
    const cityValidation = validateCity(city);
    return cityValidation;
}, {
    name: "validate_city",
    description: "Valida si una ciudad está dentro de la cobertura de servicio de InduEquipos Andina S.A.S.",
    schema: z.object({
        city: z.string().min(2).describe("Nombre de la ciudad a validar"),
    }),
});
// ==========================================
// CONJUNTO DE HERRAMIENTAS GENERALES
// ==========================================
/**
 * Herramientas generales disponibles para todos los agentes
 */
export const generalTools = [
    contactTool,
    getProductInfoTool,
    troubleshootIssueTool,
    validateCityTool,
];
// ==========================================
// EXPORTACIONES PARA COMPATIBILIDAD
// ==========================================
/**
 * Todas las herramientas generales en un array
 */
export const allGeneralTools = generalTools;
/**
 * Herramientas principales (legacy)
 */
export const mainTools = [
    contactTool,
    getProductInfoTool,
    troubleshootIssueTool,
];
