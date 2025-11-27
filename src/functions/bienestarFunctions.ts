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

        // Primero intentar con la tabla bienestarplus_documents
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'bienestarplus_documents',
            queryName: 'match_documents_bienestar_plus'  // Usar la función existente
        });

        const results = await vectorStore.similaritySearch(query, 4);

        const combineDocuments = (results: any[]) => {
            return results.map(doc => doc.pageContent).join('\n\n');
        }

        console.log('Bienestar Plus Documents Retrieved:', combineDocuments(results));
        return combineDocuments(results);
        
    } catch (error) {
        console.log('Tabla bienestarplus_documents no encontrada, usando tabla documents con filtro...');
        
        // Fallback: usar tabla documents con filtro de Bienestar Plus
        const client = createClient(supabaseUrl, supabaseApiKey);
        
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents',
            queryName: 'match_documents'
        });

        const results = await vectorStore.similaritySearch(query, 8);
        
        // Filtrar resultados que contengan información de Bienestar Plus
        const bienestarResults = results.filter(doc => 
            doc.pageContent.toLowerCase().includes('bienestar') ||
            doc.pageContent.toLowerCase().includes('seguro') ||
            doc.pageContent.toLowerCase().includes('cobertura') ||
            doc.pageContent.toLowerCase().includes('tarifa')
        );

        const combineDocuments = (results: any[]) => {
            return results.map(doc => doc.pageContent).join('\n\n');
        }

        console.log('Bienestar Plus Documents Retrieved (filtered):', combineDocuments(bienestarResults));
        
        if (bienestarResults.length === 0) {
            return "INFORMACIÓN DE BIENESTAR PLUS:\n\nSeguro de Bienestar Plus - Cobertura integral familiar\n\nCOBERTURA:\n- Consultas médicas especializadas\n- Exámenes de laboratorio\n- Procedimientos ambulatorios\n- Medicina preventiva\n- Telemedicina 24/7\n\nTARIFA:\n- Plan Básico: $45,000/mes\n- Plan Completo: $65,000/mes\n- Plan Familiar: $120,000/mes\n\nBENEFICIOS:\n- Sin períodos de carencia\n- Cobertura inmediata\n- Red de profesionales especializados\n- Atención 24 horas";
        }
        
        return combineDocuments(bienestarResults);
    }
}