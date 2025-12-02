import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchMascotasDocuments } from "../functions/mascotasFunctions.js";
/**
 * Herramienta para consultar información oficial del Seguro de Mascotas
 * Esta herramienta busca en la base de datos vectorial usando embeddings
 */
export const consultMascotasSpecialistTool = tool(async ({ consulta }) => {
    try {
        console.log(`Consultando documentos del Seguro de Mascotas para: "${consulta}"`);
        const resultado = await searchMascotasDocuments(consulta);
        if (!resultado || resultado.trim() === "") {
            return "No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Mascotas.";
        }
        return resultado;
    }
    catch (error) {
        console.error("Error consultando documentos del Seguro de Mascotas:", error);
        return `No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Mascotas.`;
    }
}, {
    name: "search_mascotas_documents",
    description: `
    Busca información oficial en la base de datos vectorial del Seguro de Mascotas.
    
    USAR ESTA HERRAMIENTA PARA:
    - Precios, tarifas y costos del seguro
    - Servicios incluidos y beneficios 
    - Mascotas cubiertas (especies, edades, razas)
    - Exclusiones y limitaciones
    - Procesos de reembolso
    - Términos y condiciones
    - Canales de atención
    - Coberturas veterinarias
    - Procedimientos incluidos
    - Medicamentos cubiertos
    - Emergencias y accidentes
    - Enfermedades específicas
    - Cirugías y tratamientos
    - Cualquier información específica del seguro
    
    IMPORTANTE: SIEMPRE usar esta herramienta antes de dar cualquier información
    sobre el Seguro de Mascotas para garantizar precisión y evitar inventar datos.
    `,
    schema: z.object({
        consulta: z.string().describe("La consulta específica sobre el Seguro de Mascotas")
    }),
});
// Exportar todas las herramientas de mascotas
export const mascotasTools = [
    consultMascotasSpecialistTool
];
