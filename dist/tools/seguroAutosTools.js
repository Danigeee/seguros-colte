import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchSeguroAutosDocuments } from "../functions/seguroAutosFunctions.js";
/**
 * Herramienta para consultar información oficial del Seguro de Autos
 * Esta herramienta busca en la base de datos vectorial usando embeddings
 */
export const consultSeguroAutosSpecialistTool = tool(async ({ consulta }) => {
    try {
        console.log(`Consultando documentos del Seguro de Autos para: "${consulta}"`);
        const resultado = await searchSeguroAutosDocuments(consulta);
        if (!resultado || resultado.trim() === "") {
            return "No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Autos.";
        }
        return resultado;
    }
    catch (error) {
        console.error("Error consultando documentos del Seguro de Autos:", error);
        return `No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Autos.`;
    }
}, {
    name: "search_seguroautos_documents",
    description: `
    Busca información oficial en la base de datos vectorial del Seguro de Autos.
    
    USAR ESTA HERRAMIENTA PARA:
    - Precios, tarifas y costos del seguro
    - Servicios incluidos y beneficios 
    - Vehículos cubiertos (tipos, modelos, años)
    - Exclusiones y limitaciones
    - Procesos de reclamación
    - Términos y condiciones
    - Cobertura todo riesgo vs responsabilidad civil
    - Valores comerciales y deducibles
    
    
    NO USAR PARA:
    - Saludos o conversación general
    - Preguntas sobre identidad del agente
    - Confirmaciones simples
    `,
    schema: z.object({
        consulta: z.string().describe("La consulta específica sobre el seguro de autos"),
    }),
});
export const seguroAutosTools = [consultSeguroAutosSpecialistTool];
