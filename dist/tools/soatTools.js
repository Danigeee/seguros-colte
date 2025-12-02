import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchSoatDocuments } from "../functions/soatFunctions.js";
/**
 * Herramienta para consultar información oficial del SOAT
 * Esta herramienta busca en la base de datos vectorial usando embeddings
 */
export const consultSoatSpecialistTool = tool(async ({ consulta }) => {
    try {
        console.log(`Consultando documentos del SOAT para: "${consulta}"`);
        const resultado = await searchSoatDocuments(consulta);
        if (!resultado || resultado.trim() === "") {
            return "No se encontró información específica sobre tu consulta en la base de datos oficial del SOAT.";
        }
        return resultado;
    }
    catch (error) {
        console.error("Error consultando documentos del SOAT:", error);
        return `No se encontró información específica sobre tu consulta en la base de datos oficial del SOAT.`;
    }
}, {
    name: "search_soat_documents",
    description: `
    Busca información oficial en la base de datos vectorial del SOAT.
    
    USAR ESTA HERRAMIENTA PARA CUALQUIER CONSULTA SOBRE:
    - Precios, tarifas y costos del SOAT
    - Coberturas incluidas
    - Vehículos cubiertos (motos, carros, tipos)
    - Exclusiones y limitaciones
    - Procesos de activación
    - Términos y condiciones
    - Canales de atención
    - Documentos requeridos
    - Vigencia y renovación
    - Beneficios adicionales
    - Atención de siniestros
    - Cualquier información específica del SOAT
    
    IMPORTANTE: SIEMPRE usar esta herramienta antes de dar cualquier información
    sobre el SOAT para garantizar precisión y evitar inventar datos.
    `,
    schema: z.object({
        consulta: z.string().describe("La consulta específica sobre el SOAT")
    }),
});
// Exportar todas las herramientas de SOAT
export const soatTools = [
    consultSoatSpecialistTool
];
