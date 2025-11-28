import { supabase } from "../config/supabase";
export const catalogService = {
    async searchCatalogItems(query) {
        const { data, error } = await supabase
            .from("items")
            .select("*")
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .eq("is_active", true)
            .limit(10);
        if (error) {
            console.error("Error searching catalog:", error);
            throw new Error(`Error searching catalog: ${error.message}`);
        }
        return data || [];
    },
    async getCategories() {
        const { data, error } = await supabase
            .from("item_categories")
            .select("*")
            .order("name");
        if (error) {
            console.error("Error getting categories:", error);
            throw new Error(`Error getting categories: ${error.message}`);
        }
        return data || [];
    }
};
