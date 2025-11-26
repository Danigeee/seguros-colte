import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;

const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseApiKey = process.env.SUPABASE_KEY as string;

export const searchVectors = async (query: string) => {
    const client = createClient(supabaseUrl, supabaseApiKey);

    const vectorStore = new SupabaseVectorStore(embeddings, {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
    });
    console.log("Petición de vectores");

    const results = await vectorStore.similaritySearch(query, 4);
    
    const combineDocuments = (results: any[]) => {
        return results.map((doc: { pageContent: any; }) => doc.pageContent).join('\n\n');
    }

    // console.log(combineDocuments(results));

    return combineDocuments(results);
}

/**
 * Busca los productos más similares a 'query' en la tabla products_vector.
 * Devuelve un string con SKU + descripción, separados por saltos de línea.
 */
export const searchProducts = async (query: string, topK = 4) => {
    const client = createClient(supabaseUrl, supabaseApiKey);
  
    // Sólo client, tableName y queryName en el constructor:
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: 'products_vector',
      queryName: 'match_products_vector',
    });
  
    console.log('Buscando productos…');
    const results = await vectorStore.similaritySearch(query, topK);
    
    const productsResults =
        results.map(doc => `• ${doc.metadata.sku}: ${doc.pageContent}`)
        .join('\n\n');

    console.log(productsResults);
    return productsResults;
};

/**
 * Busca conversaciones similares a 'query' en la tabla vectorial de conversaciones.
 * Muestra ejemplos reales de conversaciones entre asesores y clientes.
 * @param query Consulta para buscar conversaciones relevantes
 * @param topK Número máximo de conversaciones a devolver
 * @returns Ejemplos formateados de conversaciones relevantes
 */
export const searchConversations = async (query: string, topK = 3) => {
  const client = createClient(supabaseUrl, supabaseApiKey);

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'conversations', // Tabla de conversaciones vectorizadas
    queryName: 'match_conversations', // Asegúrate de crear esta función en Supabase
  });

  console.log('Buscando conversaciones relevantes...');
  const results = await vectorStore.similaritySearch(query, topK);

  // Formatear los resultados para mostrar la conversación de manera legible
  const conversationsResults = results.map(doc => {
    const metadata = doc.metadata;
    
    // Formato con pregunta-respuesta y contexto
    return `
### ${metadata.intent || 'Conversación'}

**Cliente**: ${metadata.question || doc.pageContent}

**Asesor**: ${metadata.answer || ''}

${metadata.outcome ? `*Resultado: ${metadata.outcome}*` : ''}
`;
  }).join('\n---\n');

  console.log(`Se encontraron ${results.length} conversaciones relevantes`);
  return conversationsResults;
};


