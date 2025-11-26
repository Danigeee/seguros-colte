import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../config/supabase";
import { Database } from "../types/db";

// Helper para tipos
type ItemRow = Database['public']['Tables']['items']['Row'];

/**
 * 1. CREATE ESTIMATION
 * Crea una nueva hoja de cotización para un cliente.
 */
export const create_estimation = tool(
  async ({ client_id, title }) => {
    try {
      // 1. Crear la cabecera de la cotización
      const { data, error } = await (supabase
        .from("estimations") as any)
        .insert({
          client_id: client_id,
          status: "draft",
          net_total: 0
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return JSON.stringify({
        status: "success",
        estimation_id: data.id,
        sequential_number: data.sequential_number,
        message: `Cotización #${data.sequential_number} creada exitosamente.`
      });
    } catch (error: any) {
      return `Error creando cotización: ${error.message}`;
    }
  },
  {
    name: "create_estimation",
    description: "Crea una nueva cotización (Estimation) vacía para un cliente. Retorna el ID de la cotización.",
    schema: z.object({
      client_id: z.string().describe("UUID del cliente (clients.id)"),
      title: z.string().optional().describe("Referencia opcional (ej: 'Banquetas Norte')")
    }),
  }
);

/**
 * 2. SEARCH CATALOG (Lista de Precios)
 * Busca items en el catálogo base para saber precios.
 */
export const search_catalog = tool(
  async ({ query }) => {
    try {
      const { data, error } = await (supabase
        .from("items") as any)
        .select("*")
        .ilike("name", `%${query}%`)
        .limit(5);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return "No se encontraron items con ese nombre.";

      // Formatear para el LLM
      const result = data.map((item: ItemRow) => 
        `ID: ${item.id} | ${item.name} | Unidad: ${item.unit} | Precio Base: $${item.unit_cost}`
      ).join("\n");

      return result;
    } catch (error: any) {
      return `Error buscando items: ${error.message}`;
    }
  },
  {
    name: "search_catalog",
    description: "Busca items y precios en el catálogo base por nombre (ej: 'Sidewalk', 'Curb').",
    schema: z.object({
      query: z.string().describe("Texto a buscar en el nombre del item")
    }),
  }
);

/**
 * 3. ADD ITEM LINE
 * Inserta una línea en estimation_items.
 */
export const add_item_line = tool(
  async ({ estimation_id, item_id, quantity, description_override }) => {
    try {
      // A. Buscar el item original para obtener precio y unidad
      const { data: itemData, error: itemError } = await (supabase
        .from("items") as any)
        .select("*")
        .eq("id", item_id)
        .single();

      if (itemError || !itemData) return "Error: Item ID no válido o no encontrado.";

      const unitCost = itemData.unit_cost || 0;
      const lineTotal = unitCost * quantity;

      // B. Insertar en estimation_items
      const { error: insertError } = await (supabase
        .from("estimation_items") as any)
        .insert({
          estimation_id: estimation_id,
          item_id: item_id,
          description: description_override || itemData.name,
          quantity: quantity,
          unit: itemData.unit,
          unit_cost: unitCost,
          line_total: lineTotal
        });

      if (insertError) throw new Error(insertError.message);

      return `Agregado: ${quantity} ${itemData.unit} de '${itemData.name}' (Total Línea: $${lineTotal})`;
    } catch (error: any) {
      return `Error agregando línea: ${error.message}`;
    }
  },
  {
    name: "add_item_line",
    description: "Agrega una línea de ítem a la cotización activa usando un ID del catálogo.",
    schema: z.object({
      estimation_id: z.string().describe("UUID de la cotización activa"),
      item_id: z.number().describe("ID numérico del item del catálogo"),
      quantity: z.number().describe("Cantidad a cotizar"),
      description_override: z.string().optional().describe("Descripción personalizada si es necesaria")
    }),
  }
);

/**
 * 4. GET ESTIMATION SUMMARY
 * Calcula el total sumando las líneas.
 */
export const get_estimation_summary = tool(
  async ({ estimation_id }) => {
    try {
      // Obtener líneas
      const { data: lines, error } = await (supabase
        .from("estimation_items") as any)
        .select("*")
        .eq("estimation_id", estimation_id);

      if (error) throw new Error(error.message);

      if (!lines || lines.length === 0) return "La cotización está vacía (0 items).";

      let total = 0;
      const summaryLines = lines.map((line: any) => {
        const t = line.line_total || 0;
        total += t;
        return `- ${line.quantity} ${line.unit} x ${line.description}: $${t.toFixed(2)}`;
      });

      await (supabase
        .from("estimations") as any)
        .update({ net_total: total })
        .eq("id", estimation_id);

      return `RESUMEN COTIZACIÓN:\n${summaryLines.join("\n")}\n\nTOTAL NETO: $${total.toFixed(2)}`;
    } catch (error: any) {
      return `Error obteniendo resumen: ${error.message}`;
    }
  },
  {
    name: "get_estimation_summary",
    description: "Obtiene el resumen actual y el total de la cotización.",
    schema: z.object({
      estimation_id: z.string().describe("UUID de la cotización")
    }),
  }
);

// Exportar herramientas para el Agente
export const costTools = [
    create_estimation,
    search_catalog,
    add_item_line,
    get_estimation_summary
];