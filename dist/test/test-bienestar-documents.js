import { searchBienestarDocuments } from '../functions/bienestarFunctions';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Función para probar la conexión directa a la tabla
async function testDirectTableAccess() {
    console.log('🔍 PROBANDO ACCESO DIRECTO A TABLA documents_bienestar_plus...\n');
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);
        // Verificar si la tabla existe y obtener algunos registros
        const { data, error, count } = await client
            .from('documents_bienestar_plus')
            .select('*', { count: 'exact' })
            .limit(5);
        if (error) {
            console.log('❌ ERROR accediendo a la tabla:', error.message);
            console.log('   Código:', error.code);
            return false;
        }
        console.log('✅ TABLA ENCONTRADA');
        console.log(`   Total de registros: ${count}`);
        console.log(`   Registros obtenidos: ${data?.length || 0}`);
        if (data && data.length > 0) {
            console.log('\n📄 MUESTRA DE DATOS:');
            data.forEach((doc, index) => {
                console.log(`   ${index + 1}. ID: ${doc.id}`);
                console.log(`      Content preview: ${doc.content ? doc.content.substring(0, 100) + '...' : 'Sin contenido'}`);
                console.log(`      Metadata: ${doc.metadata ? JSON.stringify(doc.metadata).substring(0, 50) + '...' : 'Sin metadata'}`);
                console.log('');
            });
        }
        return true;
    }
    catch (error) {
        console.log('❌ EXCEPCIÓN accediendo a la tabla:', error);
        return false;
    }
}
// Función para probar la función de búsqueda vectorial
async function testVectorSearchFunction() {
    console.log('🔍 PROBANDO FUNCIÓN match_documents_bienestar_plus...\n');
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);
        // Verificar si la función existe ejecutándola directamente
        const { data, error } = await client.rpc('match_documents_bienestar_plus', {
            query_embedding: new Array(1536).fill(0.1), // Vector dummy para OpenAI embeddings
            match_count: 3,
            filter: {}
        });
        if (error) {
            console.log('❌ ERROR ejecutando función vectorial:', error.message);
            console.log('   Código:', error.code);
            return false;
        }
        console.log('✅ FUNCIÓN VECTORIAL ENCONTRADA');
        console.log(`   Resultados: ${data?.length || 0}`);
        if (data && data.length > 0) {
            console.log('\n📊 RESULTADOS DE BÚSQUEDA VECTORIAL:');
            data.forEach((result, index) => {
                console.log(`   ${index + 1}. Similarity: ${result.similarity || 'N/A'}`);
                console.log(`      Content: ${result.content ? result.content.substring(0, 80) + '...' : 'Sin contenido'}`);
                console.log('');
            });
        }
        return true;
    }
    catch (error) {
        console.log('❌ EXCEPCIÓN ejecutando función vectorial:', error);
        return false;
    }
}
// Función para probar SupabaseVectorStore
async function testSupabaseVectorStore() {
    console.log('🔍 PROBANDO SUPABASE VECTOR STORE...\n');
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);
        const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents_bienestar_plus',
            queryName: 'match_documents_bienestar_plus'
        });
        console.log('✅ VectorStore creado exitosamente');
        // Probar búsqueda
        const results = await vectorStore.similaritySearch('cobertura seguro bienestar', 3);
        console.log(`✅ Búsqueda completada: ${results.length} resultados`);
        if (results.length > 0) {
            console.log('\n📋 RESULTADOS DE BÚSQUEDA:');
            results.forEach((doc, index) => {
                console.log(`   ${index + 1}. Content: ${doc.pageContent.substring(0, 100)}...`);
                console.log(`      Metadata: ${JSON.stringify(doc.metadata)}`);
                console.log('');
            });
        }
        return true;
    }
    catch (error) {
        console.log('❌ ERROR en VectorStore:', error);
        return false;
    }
}
// Función para probar la función principal de búsqueda
async function testMainSearchFunction() {
    console.log('🔍 PROBANDO FUNCIÓN searchBienestarDocuments...\n');
    const testQueries = [
        'cobertura',
        'precio',
        'tarifa',
        'beneficios',
        'servicios incluidos',
        'plan familiar'
    ];
    for (const query of testQueries) {
        try {
            console.log(`\n🔎 Probando consulta: "${query}"`);
            const result = await searchBienestarDocuments(query);
            if (result) {
                console.log(`✅ Resultado obtenido (${result.length} caracteres)`);
                console.log(`   Preview: ${result.substring(0, 150)}...`);
            }
            else {
                console.log('⚠️  Sin resultados para esta consulta');
            }
        }
        catch (error) {
            console.log(`❌ Error en consulta "${query}":`, error);
        }
    }
}
// Función para verificar configuración
async function checkConfiguration() {
    console.log('⚙️  VERIFICANDO CONFIGURACIÓN...\n');
    console.log(`Supabase URL: ${supabaseUrl ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`Supabase Key: ${supabaseApiKey ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ No configurado'}`);
    console.log('');
}
// Función principal de pruebas
async function runTests() {
    console.log('🧪 INICIANDO PRUEBAS DE DOCUMENTOS BIENESTAR PLUS\n');
    console.log('='.repeat(60));
    console.log('');
    // Verificar configuración
    await checkConfiguration();
    // Prueba 1: Acceso directo a la tabla
    console.log('1️⃣  PRUEBA: ACCESO DIRECTO A TABLA');
    console.log('-'.repeat(40));
    const tableAccess = await testDirectTableAccess();
    console.log('');
    // Prueba 2: Función de búsqueda vectorial
    console.log('2️⃣  PRUEBA: FUNCIÓN VECTORIAL');
    console.log('-'.repeat(40));
    const vectorFunction = await testVectorSearchFunction();
    console.log('');
    // Prueba 3: SupabaseVectorStore
    console.log('3️⃣  PRUEBA: SUPABASE VECTOR STORE');
    console.log('-'.repeat(40));
    const vectorStore = await testSupabaseVectorStore();
    console.log('');
    // Prueba 4: Función principal
    console.log('4️⃣  PRUEBA: FUNCIÓN PRINCIPAL DE BÚSQUEDA');
    console.log('-'.repeat(40));
    await testMainSearchFunction();
    console.log('');
    // Resumen
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`Acceso a tabla: ${tableAccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Función vectorial: ${vectorFunction ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Vector Store: ${vectorStore ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    if (tableAccess && vectorFunction && vectorStore) {
        console.log('🎉 TODAS LAS PRUEBAS PASARON - El sistema está funcionando correctamente');
    }
    else {
        console.log('⚠️  ALGUNAS PRUEBAS FALLARON - Revisa la configuración de Supabase');
    }
}
// Ejecutar pruebas
if (require.main === module) {
    runTests().catch(console.error);
}
export { testDirectTableAccess, testVectorSearchFunction, testSupabaseVectorStore, testMainSearchFunction, runTests };
