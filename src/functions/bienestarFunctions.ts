import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const searchBienestarDocuments = async (query: string) => {
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents_bienestar_final',       // <--- TABLA NUEVA
            queryName: 'match_documents_bienestar_final'  // <--- FUNCIÓN NUEVA
        });

        console.log(`🔍 Buscando: "${query}"...`);
        
        // Recuperamos 6 chunks para asegurar que la IA lea las "letras pequeñas"
        const results = await vectorStore.similaritySearch(query, 6);

        if (results.length === 0) {
            console.log("⚠️ No se encontró información relevante en el PDF.");
            return ""; // Retornar vacío es mejor que inventar
        }

        const context = results.map(doc => doc.pageContent).join('\n\n---\n\n');
        console.log(`✅ ${results.length} fragmentos recuperados.`);
        
        return context;
        
    } catch (error) {
        console.error('❌ Error fatal en búsqueda vectorial:', error);
        return ""; // En caso de error técnico, silencio para evitar alucinación
    }
}