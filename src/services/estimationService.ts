import { supabase } from "../config/supabase";
import { Tables, Insert } from "../types/db";

export const estimationService = {
  async findDraftEstimation(clientId: string): Promise<Tables<"estimations"> | null> {
    const { data, error } = await supabase
      .from("estimations")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding draft estimation:", error);
    }

    return data || null;
  },

  async countDraftEstimations(clientId: string): Promise<number> {
    const { data, error, count } = await supabase
      .from("estimations")
      .select("id", { count: 'exact', head: false })
      .eq("client_id", clientId)
      .eq("status", "draft");

    if (error) {
      console.error("Error counting draft estimations:", error);
      return 0;
    }

    return count || 0;
  },

  async createEstimation(clientId: string, notes?: string): Promise<Tables<"estimations">> {
    const { data: company } = await supabase.from("companies").select("id").limit(1).single();
    
    const newEstimation: Insert<"estimations"> = {
      client_id: clientId,
      company_id: company?.id,
      status: 'draft',
      notes: notes || '',
      estimation_date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("estimations")
      .insert(newEstimation)
      .select()
      .single();

    if (error) {
      console.error("Error creating estimation:", error);
      throw new Error(`Error creating estimation: ${error.message}`);
    }

    return data;
  },

  async addItemToEstimation(
    estimationId: string, 
    itemData: { 
      itemId?: number, 
      description: string, 
      quantity: number, 
      unit: string, 
      unitCost: number,
      categoryId?: number
    }
  ): Promise<Tables<"estimation_items">> {
    
    const lineTotal = itemData.quantity * itemData.unitCost;

    const newItem: Insert<"estimation_items"> = {
      estimation_id: estimationId,
      item_id: itemData.itemId,
      description: itemData.description,
      quantity: itemData.quantity,
      unit: itemData.unit,
      unit_cost: itemData.unitCost,
      category_id: itemData.categoryId,
      line_total: lineTotal
    };

    const { data, error } = await supabase
      .from("estimation_items")
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error("Error adding item to estimation:", error);
      throw new Error(`Error adding item: ${error.message}`);
    }

    await this.recalculateEstimationTotals(estimationId);

    return data;
  },

  async recalculateEstimationTotals(estimationId: string): Promise<void> {
    const { data: items } = await supabase
      .from("estimation_items")
      .select("line_total")
      .eq("estimation_id", estimationId);

    const total = items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;

    await supabase
      .from("estimations")
      .update({ net_total: total })
      .eq("id", estimationId);
  },

  async getEstimationDetails(estimationId: string) {
    const { data: estimation, error: estError } = await supabase
      .from("estimations")
      .select(`
        *,
        client:clients(name),
        items:estimation_items(*)
      `)
      .eq("id", estimationId)
      .single();

    if (estError) throw estError;
    return estimation;
  },

  async getAllEstimationsForClient(clientId: string): Promise<Tables<"estimations">[]> {
    const { data, error } = await supabase
      .from("estimations")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching estimations:", error);
      throw new Error(`Error fetching estimations: ${error.message}`);
    }

    return data || [];
  },

  async getEstimationById(estimationId: string): Promise<Tables<"estimations"> | null> {
    const { data, error } = await supabase
      .from("estimations")
      .select("*")
      .eq("id", estimationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding estimation:", error);
    }

    return data || null;
  }
};
