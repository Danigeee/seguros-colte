import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

async function quickTest() {
    console.log('⚡ PRUEBA RÁPIDA DE TABLA documents_bienestar_plus\n');
    
    try {
        const client = createClient(supabaseUrl, supabaseApiKey);
        
        console.log('🔍 Verificando tabla documents_bienestar_plus...');
        
        // Test 1: Verificar si la tabla existe
        const { count, error: countError } = await client
            .from('documents_bienestar_plus')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.log(`❌ Error accediendo a la tabla: ${countError.message}`);
            return;
        }
        
        console.log(`✅ Tabla encontrada con ${count} registros`);
        
        // Test 2: Obtener estructura de la tabla
        const { data: sample, error: sampleError } = await client
            .from('documents_bienestar_plus')
            .select('*')
            .limit(1);
            
        if (sampleError) {
            console.log(`❌ Error obteniendo muestra: ${sampleError.message}`);
            return;
        }
        
        if (sample && sample.length > 0) {
            console.log('\n📋 ESTRUCTURA DE LA TABLA:');
            const columns = Object.keys(sample[0]);
            columns.forEach(col => {
                console.log(`   - ${col}: ${typeof sample[0][col]}`);
            });
        }
        
        // Test 3: Verificar función match_documents_bienestar_plus
        console.log('\n🔍 Verificando función match_documents_bienestar_plus...');
        
        try {
            const { data: funcResult, error: funcError } = await client.rpc('match_documents_bienestar_plus', {
                query_embedding: new Array(1536).fill(0.1),
                match_count: 1,
                filter: {}
            });
            
            if (funcError) {
                console.log(`❌ Función no encontrada: ${funcError.message}`);
            } else {
                console.log('✅ Función vectorial disponible');
            }
        } catch (e) {
            console.log('❌ Error probando función vectorial:', e);
        }
        
        console.log('\n🎉 Prueba rápida completada');
        
    } catch (error) {
        console.log('❌ Error general:', error);
    }
}

quickTest();