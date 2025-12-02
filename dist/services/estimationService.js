import { supabase } from "../config/supabase.js";
export const estimationService = {
    async findDraftEstimation(clientId) {
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
    async countDraftEstimations(clientId) {
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
    async createEstimation(clientId, notes) {
        const { data: company } = await supabase.from("companies").select("id").limit(1).single();
        const newEstimation = {
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
    async addItemToEstimation(estimationId, itemData) {
        const lineTotal = itemData.quantity * itemData.unitCost;
        const newItem = {
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
    async recalculateEstimationTotals(estimationId) {
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
    async getEstimationDetails(estimationId) {
        const { data: estimation, error: estError } = await supabase
            .from("estimations")
            .select(`
        *,
        client:clients(name),
        items:estimation_items(*)
      `)
            .eq("id", estimationId)
            .single();
        if (estError)
            throw estError;
        return estimation;
    },
    async getAllEstimationsForClient(clientId) {
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
    async getEstimationById(estimationId) {
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
