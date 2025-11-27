import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchBienestarDocuments } from "../functions/bienestarFunctions";

/**
 * Herramienta para consultar información oficial de Bienestar Plus
 * Esta herramienta busca en la base de datos de documentos oficiales
 * para responder preguntas sobre coberturas, precios, servicios y beneficios
 */
export const consultBienestarSpecialistTool = tool(
  async ({ consulta }: { consulta: string }) => {
    try {
      console.log(`Consultando documentos de Bienestar Plus para: "${consulta}"`);
      
      const resultado = await searchBienestarDocuments(consulta);
      
      if (!resultado || resultado.trim() === '') {
        return "No se encontró información específica sobre tu consulta en la base de datos oficial de Bienestar Plus.";
      }
      
      return resultado;
      
    } catch (error: any) {
      console.error("Error consultando documentos de Bienestar Plus:", error);
      
      // Información de respaldo básica para Bienestar Plus
      return `No se encontró información específica sobre tu consulta en la base de datos oficial de Bienestar Plus.`;
    }
  },
  {
    name: "consultBienestarSpecialistTool",
    description: "Consulta información oficial y verificada sobre el seguro Bienestar Plus. Usa esta herramienta OBLIGATORIAMENTE antes de responder cualquier pregunta sobre coberturas, precios, beneficios o servicios de Bienestar Plus.",
    schema: z.object({
      consulta: z.string().describe("La pregunta completa del cliente o una frase de búsqueda detallada para encontrar la información en los documentos (ej: 'cubre a mis familiares', 'precio del plan familiar', 'servicios de odontología incluidos'). NO uses palabras sueltas como 'cobertura' o 'precio', sé específico.")
    })
  }
);

/**
 * Herramienta alternativa para búsquedas más específicas
 */
export const searchBienestarDocumentsTool = tool(
  async ({ searchQuery }: { searchQuery: string }) => {
    try {
      console.log(`Búsqueda específica en documentos Bienestar Plus: "${searchQuery}"`);
      
      const resultado = await searchBienestarDocuments(searchQuery);
      
      if (!resultado || resultado.trim() === '') {
        return "No se encontraron documentos que coincidan con tu búsqueda.";
      }
      
      return resultado;
      
    } catch (error: any) {
      console.error("Error en búsqueda de documentos:", error);
      

      
      return "Error técnico temporal. Te puedo ayudar con información sobre Bienestar Plus. ¿Qué necesitas saber?";
    }
  },
  {
    name: "search_bienestar_documents", 
    description: "Busca información específica en los documentos oficiales de Bienestar Plus usando términos de búsqueda precisos.",
    schema: z.object({
      searchQuery: z.string().describe("Términos específicos de búsqueda para encontrar información en los documentos oficiales")
    })
  }
);






export const bienestarTools = [
  consultBienestarSpecialistTool,
  searchBienestarDocumentsTool
];