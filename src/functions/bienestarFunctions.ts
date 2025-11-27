import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;

const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const searchBienestarDocuments = async (query: string) => {
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);

        // Configuración apuntando a tu tabla y función corregida
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents_bienestar_test',
            queryName: 'match_documents_bienestar_test' 
        });

        // Hacemos la búsqueda
        // match_threshold ya no es obligatorio en la DB, así que esto funcionará
        const results = await vectorStore.similaritySearch(query, 6);

        const combineDocuments = (results: any[]) => {
            return results.map(doc => doc.pageContent).join('\n\n');
        }

        console.log(`✅ Documentos encontrados: ${results.length}`);
        
        if (results.length > 0) {
             // Retorna el contenido real del PDF
            return combineDocuments(results);
        } else {
            console.log("⚠️ No se encontraron coincidencias en el vector store.");
            return ""; // Retornar vacío para que la IA diga "No sé" en lugar de inventar.
        }
        
    } catch (error) {
        console.error('❌ Error CRÍTICO consultando Supabase:', error);
        // Retornamos cadena vacía para evitar que el bot alucine con datos falsos
        return ""; 
    }
}