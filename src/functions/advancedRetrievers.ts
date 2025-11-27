import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';

//! Comentario importante: Esta función es una versión mejorada de searchBienestarDocuments, pero en este momento no se está usando en ningún agente. Se planea integrarla en el futuro para mejorar la precisión de las respuestas mediante re-ranking con LLM.

dotenv.config();

const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usamos un modelo rápido y barato para el re-ranking
const rerankLLM = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
});

interface SearchResult {
    pageContent: string;
    metadata: any;
    score?: number;
}

/**
 * Realiza una búsqueda vectorial y luego refina los resultados usando un LLM (Re-ranking).
 * Esto mejora drásticamente la precisión al eliminar chunks irrelevantes.
 */
export const smartSearchBienestar = async (query: string): Promise<string> => {
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);

        // Usamos la misma tabla y función que ya tienes configurada y funcionando
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents_bienestar_final',
            queryName: 'match_documents_bienestar_final'
        });

        console.log(`🔍 Smart Search: Buscando vectores para "${query}"...`);
        
        // 1. Recuperación Amplia (Broad Retrieval)
        // Traemos 15 candidatos para no perder nada potencial
        const results = await vectorStore.similaritySearchWithScore(query, 15);

        if (results.length === 0) {
            console.log("⚠️ No se encontraron vectores.");
            return "";
        }

        // 2. Filtrado por Umbral Básico (Thresholding)
        // Eliminamos coincidencias muy pobres.
        const candidates = results.filter(([doc, score]) => score > 0.65).map(([doc, score]) => ({
            pageContent: doc.pageContent,
            metadata: doc.metadata,
            score
        }));

        console.log(`📊 Candidatos iniciales: ${results.length} -> Filtrados por score: ${candidates.length}`);

        if (candidates.length === 0) return "";

        // 3. Re-ranking / Filtrado Semántico con LLM
        const relevantContent = await rerankChunksWithLLM(query, candidates);

        return relevantContent;
        
    } catch (error) {
        console.error('❌ Error en smartSearchBienestar:', error);
        return ""; 
    }
}

async function rerankChunksWithLLM(query: string, docs: SearchResult[]): Promise<string> {
    // Preparamos los chunks numerados para el LLM
    const docsText = docs.map((d, i) => `[FRAGMENTO ${i + 1}]\n${d.pageContent}`).join('\n\n');

    const systemPrompt = `Eres un experto analista de documentos de seguros. Tu trabajo es filtrar información irrelevante.
Tienes una lista de fragmentos de texto recuperados de una base de datos y una pregunta del usuario.
Debes evaluar CADA fragmento y decidir si contiene información útil para responder la pregunta.

CRITERIOS DE RELEVANCIA:
- El fragmento debe hablar directamente del tema de la pregunta.
- Si la pregunta es sobre precios, el fragmento debe tener precios.
- Si la pregunta es sobre exclusiones, el fragmento debe mencionar exclusiones.
- Ignora fragmentos que solo contengan definiciones generales o texto legal sin relación directa.

SALIDA ESPERADA:
Devuelve ÚNICAMENTE los números de los fragmentos relevantes separados por comas (ej: "1, 3, 5").
Si NINGÚN fragmento es relevante, devuelve "NINGUNO".`;

    const userPrompt = `PREGUNTA: "${query}"

FRAGMENTOS DISPONIBLES:
${docsText}

¿Cuáles fragmentos son realmente relevantes?`;

    console.log("🤖 Ejecutando Re-ranking con LLM...");
    const response = await rerankLLM.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
    ]);

    const content = response.content.toString().trim();
    console.log(`🎯 Decisión del Re-ranker: ${content}`);

    if (content.includes("NINGUNO")) {
        return "";
    }

    // Extraer índices
    const indices = content.match(/\d+/g)?.map(Number) || [];
    
    // Filtrar y unir los documentos seleccionados
    const finalDocs = indices
        .map(i => docs[i - 1]) // Ajustar índice 1-based a 0-based
        .filter(d => d !== undefined);

    if (finalDocs.length === 0) return "";

    console.log(`✅ Seleccionados ${finalDocs.length} fragmentos finales de alta calidad.`);

    return finalDocs.map(d => d.pageContent).join('\n\n---\n\n');
}
