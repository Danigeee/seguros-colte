import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getProductCatalog, calculateQuote, getSalesAnalytics, getActivePromotions, checkInventory, } from "../functions/salesFunctions";
// ==========================================
// HERRAMIENTAS DE VENTAS
// ==========================================
/**
 * Herramienta para obtener catálogo de productos con filtros
 */
export const getProductCatalogTool = tool(async (params) => {
    const catalog = getProductCatalog(params);
    return catalog;
}, {
    name: "get_product_catalog",
    description: "Obtiene el catálogo completo de productos disponibles para venta con filtros opcionales por categoría, precio y disponibilidad.",
    schema: z.object({
        category: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
            "todos",
        ])
            .optional()
            .default("todos")
            .describe("Categoría de productos a filtrar"),
        minPrice: z
            .number()
            .positive()
            .optional()
            .describe("Precio mínimo para filtrar productos"),
        maxPrice: z
            .number()
            .positive()
            .optional()
            .describe("Precio máximo para filtrar productos"),
        inStock: z
            .boolean()
            .optional()
            .default(true)
            .describe("Si debe mostrar solo productos en stock"),
    }),
});
/**
 * Herramienta para calcular cotizaciones detalladas
 */
export const calculateQuoteTool = tool(async (params) => {
    const quote = calculateQuote(params);
    return quote;
}, {
    name: "calculate_quote",
    description: "Calcula una cotización detallada para productos específicos con descuentos automáticos según tipo de cliente y cantidad.",
    schema: z.object({
        productId: z
            .string()
            .min(1)
            .describe("ID del producto (ej: PAN001, CAR001, CHO001)"),
        quantity: z
            .number()
            .int()
            .min(1)
            .describe("Cantidad de productos a cotizar"),
        customerType: z
            .enum(["nuevo", "recurrente", "empresarial"])
            .optional()
            .default("nuevo")
            .describe("Tipo de cliente para aplicar descuentos"),
        includeInstallation: z
            .boolean()
            .optional()
            .default(false)
            .describe("Si incluir costo de instalación en la cotización"),
        includeWarrantyExtension: z
            .boolean()
            .optional()
            .default(false)
            .describe("Si incluir extensión de garantía en la cotización"),
    }),
});
/**
 * Herramienta para obtener análisis de ventas y tendencias
 */
export const getSalesAnalyticsTool = tool(async (params) => {
    const analytics = getSalesAnalytics(params);
    return analytics;
}, {
    name: "get_sales_analytics",
    description: "Proporciona análisis de ventas y tendencias del mercado por período y categoría de productos.",
    schema: z.object({
        timeframe: z
            .enum(["semanal", "mensual", "trimestral", "anual"])
            .optional()
            .default("mensual")
            .describe("Período de tiempo para el análisis"),
        productCategory: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
            "todos",
        ])
            .optional()
            .default("todos")
            .describe("Categoría específica para analizar"),
        includeComparisons: z
            .boolean()
            .optional()
            .default(true)
            .describe("Si incluir comparaciones con períodos anteriores"),
    }),
});
/**
 * Herramienta para obtener promociones activas
 */
export const getActivePromotionsTool = tool(async (params) => {
    const promotions = getActivePromotions(params.category);
    return promotions;
}, {
    name: "get_active_promotions",
    description: "Obtiene las promociones y descuentos activos por categoría de productos.",
    schema: z.object({
        category: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
            "todas",
        ])
            .optional()
            .default("todas")
            .describe("Categoría para filtrar promociones"),
    }),
});
/**
 * Herramienta para verificar inventario
 */
export const checkInventoryTool = tool(async (params) => {
    const inventory = checkInventory(params.productId);
    return inventory;
}, {
    name: "check_inventory",
    description: "Verifica la disponibilidad de inventario para productos específicos o general.",
    schema: z.object({
        productId: z
            .string()
            .optional()
            .describe("ID específico del producto a consultar. Si no se proporciona, muestra inventario general"),
    }),
});
// ==========================================
// CONJUNTO DE HERRAMIENTAS PARA VENTAS
// ==========================================
export const salesTools = [
    getProductCatalogTool,
    calculateQuoteTool,
    getSalesAnalyticsTool,
    getActivePromotionsTool,
    checkInventoryTool,
];
