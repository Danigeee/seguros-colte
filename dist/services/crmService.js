import { supabase } from "../config/supabase.js";
export const crmService = {
    async findClientByName(name) {
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .ilike("name", `%${name}%`)
            .limit(5);
        if (error) {
            console.error("Error finding client:", error);
            throw new Error(`Error finding client: ${error.message}`);
        }
        return data || [];
    },
    async createClient(clientData) {
        if (!clientData.company_id) {
            const { data: company } = await supabase.from("companies").select("id").limit(1).single();
            if (company) {
                clientData.company_id = company.id;
            }
        }
        const { data, error } = await supabase
            .from("clients")
            .insert(clientData)
            .select()
            .single();
        if (error) {
            console.error("Error creating client:", error);
            throw new Error(`Error creating client: ${error.message}`);
        }
        return data;
    },
    async getClientById(id) {
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            console.error("Error getting client:", error);
            return null;
        }
        return data;
    },
    async searchClients(query) {
        const { data, error } = await supabase
            .from("clients")
            .select("*")
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);
        if (error) {
            console.error("Error searching clients:", error);
            throw new Error(`Error searching clients: ${error.message}`);
        }
        return data || [];
    }
};
