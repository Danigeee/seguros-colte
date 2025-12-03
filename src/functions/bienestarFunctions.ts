import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
// 1. ELIMINA: import { createClient } from '@supabase/supabase-js';

// 2. AGREGA: Importa tu cliente compartido
import { supabase } from '../config/supabase.js'; 
import dotenv from 'dotenv';

dotenv.config();

const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
// Ya no necesitas leer las variables de entorno para la URL/KEY aquí si usas el config/supabase

export const searchBienestarDocuments = async (query: string) => {
    try {
        // 3. ELIMINA: const client = createClient(supabaseUrl, supabaseApiKey);

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: supabase, // ✅ 4. USA LA INSTANCIA COMPARTIDA
            tableName: 'documents_bienestar_final',
            queryName: 'match_documents_bienestar_final'
        });

        console.log(`🔍 Buscando: "${query}"...`);
        
        const results = await vectorStore.similaritySearch(query, 8);

        if (results.length === 0) {
            console.log("⚠️ No se encontró información relevante en el PDF.");
            return ""; 
        }

        // ... (El resto de tu código de logs y format puede quedar igual)
        
        const context = results.map(doc => doc.pageContent).join('\n\n---\n\n');
        return context;
        
    } catch (error) {
        console.error('❌ Error fatal en búsqueda vectorial:', error);
        return "";
    }
}