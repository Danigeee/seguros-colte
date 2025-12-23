import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchDentixDocuments } from "../functions/dentixFunctions.js";

/**
 * Herramienta para consultar información oficial del Seguro Dental Dentix
 * Esta herramienta busca en la base de datos vectorial usando embeddings
 */
export const consultDentixSpecialistTool = tool(
  async ({ consulta }: { consulta: string }) => {
    try {
      console.log(
        `Consultando documentos del Seguro Dental Dentix para: "${consulta}"`
      );

      const resultado = await searchDentixDocuments(consulta);

      if (!resultado || resultado.trim() === "") {
        return "No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro Dental Dentix.";
      }

      return resultado;
    } catch (error: any) {
      console.error("Error consultando documentos del Seguro Dental Dentix:", error);

      return `No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro Dental Dentix.`;
    }
  },
  {
    name: "search_dentix_documents",
    description: `
    Busca información oficial en la base de datos vectorial del Seguro Dental Dentix.
    
    USAR ESTA HERRAMIENTA PARA:
    - Precios, tarifas y costos del seguro dental
    - Servicios incluidos y beneficios dentales
    - Tratamientos cubiertos (preventivos, curativos, especializados)
    - Exclusiones y limitaciones
    - Procesos de autorización y reembolso
    - Términos y condiciones
    - Red de odontólogos y clínicas dentales
    - Copagos y deducibles
    - Procedimientos de emergencia dental
    - Cobertura de ortodoncia y cirugía oral
    
    NO USAR PARA:
    - Saludos o conversación general
    - Preguntas sobre identidad del agente
    - Confirmaciones simples
    `,
    schema: z.object({
      consulta: z.string().describe("La consulta específica sobre el seguro dental Dentix"),
    }),
  }
);

export const dentixTools = [consultDentixSpecialistTool];