import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchBienestarDocuments } from "../functions/bienestarFunctions.js";
import { smartSearchBienestar } from "../functions/advancedRetrievers.js";

/**
 * Herramienta para consultar información oficial de Bienestar Plus
 * Esta herramienta busca en la base de datos de documentos oficiales
 * para responder preguntas sobre coberturas, precios, servicios y beneficios
 */
export const consultBienestarSpecialistTool = tool(
  async ({ consulta }: { consulta: string }) => {
    try {
      console.log(
        `Consultando documentos de Bienestar Plus para: "${consulta}"`
      );

      const resultado = await searchBienestarDocuments(consulta);

      if (!resultado || resultado.trim() === "") {
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
    description:
      "Consulta información oficial y verificada sobre el seguro Bienestar Plus. Usa esta herramienta OBLIGATORIAMENTE antes de responder cualquier pregunta sobre coberturas, precios, beneficios o servicios de Bienestar Plus.",
    schema: z.object({
      consulta: z
        .string()
        .describe(
          "La pregunta completa del cliente o una frase de búsqueda detallada para encontrar la información en los documentos (ej: 'cubre a mis familiares', 'precio del plan familiar', 'servicios de odontología incluidos'). NO uses palabras sueltas como 'cobertura' o 'precio', sé específico."
        ),
    }),
  }
);

/**
 * Herramienta alternativa para búsquedas más específicas
 */
export const searchBienestarDocumentsTool = tool(
  async ({ searchQuery }: { searchQuery: string }) => {
    try {
      console.log(
        `Búsqueda específica en documentos Bienestar Plus: "${searchQuery}"`
      );

      const resultado = await searchBienestarDocuments(searchQuery);

      if (!resultado || resultado.trim() === "") {
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
    description:
      "Busca información específica en los documentos oficiales de Bienestar Plus usando términos de búsqueda precisos.",
    schema: z.object({
      searchQuery: z
        .string()
        .describe(
          "Términos específicos de búsqueda para encontrar información en los documentos oficiales"
        ),
    }),
  }
);

/**
 * NUEVA HERRAMIENTA: Búsqueda Inteligente con Re-ranking
 * Esta herramienta usa la nueva lógica de filtrado semántico para evitar alucinaciones.
 * Se puede usar en paralelo o como reemplazo de la anterior.
 */
//! Esta no está en uso pero es tentativa para usar en el futuro
export const consultBienestarSmartTool = tool(
  async ({ consulta }: { consulta: string }) => {
    try {
      console.log(
        `🧠 Consultando Bienestar Plus (Smart Search) para: "${consulta}"`
      );

      const resultado = await smartSearchBienestar(consulta);

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
    } catch (error: any) {
      console.error("Error en Smart Search:", error);
      return "Ocurrió un error técnico al consultar la información detallada.";
    }
  },
  {
    name: "consult_bienestar_smart",
    description:
      "Consulta información oficial de Bienestar Plus usando un sistema de búsqueda inteligente que filtra resultados irrelevantes. Úsala para preguntas complejas sobre coberturas, exclusiones o detalles específicos.",
    schema: z.object({
      consulta: z
        .string()
        .describe(
          "La pregunta completa del cliente o el tema específico a buscar."
        ),
    }),
  }
);

export const bienestarTools = [
  consultBienestarSpecialistTool,
  searchBienestarDocumentsTool,
  // consultBienestarSmartTool //! <-- No está en uso aún
];
