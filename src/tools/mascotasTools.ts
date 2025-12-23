import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchMascotasDocuments } from "../functions/mascotasFunctions.js";
import { getClientByPhoneNumber } from "../functions/clientFunctions.js";

/**
 * Herramienta para consultar información oficial del Seguro de Mascotas
 * Esta herramienta busca en la base de datos vectorial usando embeddings
 */
export const consultMascotasSpecialistTool = tool(
  async ({ consulta }: { consulta: string }) => {
    try {
      console.log(
        `Consultando documentos del Seguro de Mascotas para: "${consulta}"`
      );

      const resultado = await searchMascotasDocuments(consulta);

      if (!resultado || resultado.trim() === "") {
        return "No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Mascotas.";
      }

      return resultado;
    } catch (error: any) {
      console.error("Error consultando documentos del Seguro de Mascotas:", error);

      return `No se encontró información específica sobre tu consulta en la base de datos oficial del Seguro de Mascotas.`;
    }
  },
  {
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
  }
);

/**
 * Herramienta para obtener datos actualizados del cliente desde Supabase
 */
export const getClientByPhoneTool = tool(
  async ({ phoneNumber }: { phoneNumber: string }) => {
    try {
      console.log(`🔍 Obteniendo datos del cliente para: ${phoneNumber}`);
      
      const clientData = await getClientByPhoneNumber(phoneNumber);
      
      if (!clientData) {
        return "Cliente no encontrado en la base de datos. Solicita al cliente que proporcione su email para procesar la compra.";
      }
      
      console.log(`✅ Datos obtenidos: ${clientData.name} - ${clientData.email}`);
      
      return JSON.stringify({
        name: clientData.name,
        email: clientData.email,
        document_id: clientData.document_id,
        phone_number: clientData.phone_number,
        service: clientData.service || 'mascotas'
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo datos del cliente:', error);
      return "Error al consultar datos del cliente. Solicita al cliente que proporcione su email.";
    }
  },
  {
    name: "getClientByPhone",
    description: "Obtiene datos actualizados del cliente desde Supabase usando el número de teléfono. Usar OBLIGATORIAMENTE antes de enviar enlaces de pago para asegurar datos correctos.",
    schema: z.object({
      phoneNumber: z.string().describe("Número de teléfono del cliente (con formato +57XXXXXXXXXX)"),
    }),
  }
);

// Exportar todas las herramientas de mascotas
export const mascotasTools = [
  consultMascotasSpecialistTool,
  getClientByPhoneTool
];
