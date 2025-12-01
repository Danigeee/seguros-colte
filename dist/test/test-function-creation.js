import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function testFunctionCreation() {
    console.log('🧪 VERIFICANDO FUNCIÓN match_documents_bienestar_plus\n');
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);
        // Crear un embedding de prueba (1536 dimensiones con valores pequeños)
        const testEmbedding = new Array(1536).fill(0).map(() => Math.random() * 0.1 - 0.05);
        console.log('🔍 Probando función con embedding de prueba...');
        // Probar la función
        const { data, error } = await client.rpc('match_documents_bienestar_plus', {
            query_embedding: testEmbedding,
            match_count: 3,
            filter: {}
        });
        if (error) {
            console.log('❌ ERROR:', error.message);
            console.log('   Código:', error.code);
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.log('\n💡 SOLUCIÓN:');
                console.log('   1. Ve a Supabase Dashboard → SQL Editor');
                console.log('   2. Ejecuta el archivo create_match_function.sql');
                console.log('   3. Vuelve a ejecutar este test');
            }
            return false;
        }
        console.log('✅ FUNCIÓN CREADA CORRECTAMENTE');
        console.log(`   Resultados obtenidos: ${data?.length || 0}`);
        if (data && data.length > 0) {
            console.log('\n📊 SAMPLE DE RESULTADOS:');
            data.slice(0, 2).forEach((result, index) => {
                console.log(`   ${index + 1}. ID: ${result.id}`);
                console.log(`      Similarity: ${result.similarity?.toFixed(4) || 'N/A'}`);
                console.log(`      Content Preview: ${result.content?.substring(0, 80)}...`);
                console.log(`      Metadata: ${JSON.stringify(result.metadata)}`);
                console.log('');
            });
        }
        // Test adicional: verificar que devuelve resultados ordenados por similitud
        if (data && data.length > 1) {
            const similarities = data.map((r) => r.similarity).filter((s) => s !== null);
            const isOrdered = similarities.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
            if (isOrdered) {
                console.log('✅ Resultados correctamente ordenados por similitud');
            }
            else {
                console.log('⚠️  Advertencia: Resultados no ordenados correctamente');
            }
        }
        return true;
    }
    catch (error) {
        console.log('❌ EXCEPCIÓN:', error);
        return false;
    }
}
async function runFunctionTest() {
    console.log('🚀 VERIFICACIÓN DE FUNCIÓN VECTORIAL\n');
    console.log('='.repeat(50));
    const success = await testFunctionCreation();
    console.log('\n' + '='.repeat(50));
    if (success) {
        console.log('🎉 FUNCIÓN FUNCIONANDO CORRECTAMENTE');
        console.log('   Ahora puedes ejecutar: npm run test:bienestar');
    }
    else {
        console.log('❌ FUNCIÓN NECESITA SER CREADA');
        console.log('   Ejecuta el archivo create_match_function.sql en Supabase');
    }
}
runFunctionTest();
