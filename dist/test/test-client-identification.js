import { identifyClientNode } from '../agents/identifyClient';
import { HumanMessage } from '@langchain/core/messages';
async function testClientIdentification() {
    console.log('🧪 PROBANDO IDENTIFICACIÓN DE CLIENTE\n');
    // Test 1: Cliente existente
    console.log('1️⃣  Test: Cliente existente (+573167813063)');
    const mockState = {
        messages: [new HumanMessage("Hola")],
        activeProjectId: "no-project-id",
        activeEstimationId: "no-estimation-id",
        activeClientId: "no-client-id",
        clientData: null,
        next: "FINISH"
    };
    const mockConfig = {
        configurable: {
            thread_id: "test-123",
            user_phone: "+573167813063"
        }
    };
    try {
        const result = await identifyClientNode(mockState, mockConfig);
        if (result.clientData) {
            console.log('✅ Cliente identificado correctamente:');
            console.log(`   Nombre: ${result.clientData.name}`);
            console.log(`   Email: ${result.clientData.email}`);
            console.log(`   Documento: ${result.clientData.document_id}`);
            console.log(`   Teléfono: ${result.clientData.phone_number}`);
        }
        else {
            console.log('⚠️  Cliente no encontrado en la base de datos');
        }
    }
    catch (error) {
        console.log('❌ Error en identificación:', error);
    }
    console.log('\n' + '-'.repeat(50));
    // Test 2: Número sin formato +57
    console.log('2️⃣  Test: Número sin formato +57 (3137249770)');
    const mockConfig2 = {
        configurable: {
            thread_id: "test-124",
            user_phone: "3137249770"
        }
    };
    try {
        const result2 = await identifyClientNode(mockState, mockConfig2);
        if (result2.clientData) {
            console.log('✅ Cliente identificado con número formateado:');
            console.log(`   Teléfono formateado: ${result2.clientData.phone_number}`);
        }
        else {
            console.log('ℹ️  Cliente no encontrado');
        }
    }
    catch (error) {
        console.log('❌ Error:', error);
    }
    console.log('\n' + '-'.repeat(50));
    // Test 3: Cliente no existente
    console.log('3️⃣  Test: Cliente no existente (+573999999999)');
    const mockConfig3 = {
        configurable: {
            thread_id: "test-125",
            user_phone: "+573999999999"
        }
    };
    try {
        const result3 = await identifyClientNode(mockState, mockConfig3);
        if (!result3.clientData) {
            console.log('✅ Correcto: Cliente no encontrado como se esperaba');
        }
        else {
            console.log('⚠️  Inesperado: Cliente encontrado');
        }
    }
    catch (error) {
        console.log('❌ Error:', error);
    }
}
// Función para verificar la estructura de la tabla dentix_clients
async function testTableStructure() {
    console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLA dentix_clients\n');
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const client = createClient(supabaseUrl, supabaseApiKey);
        const { data, error, count } = await client
            .from('dentix_clients')
            .select('name, email, document_id, phone_number', { count: 'exact' })
            .limit(3);
        if (error) {
            console.log('❌ Error accediendo a dentix_clients:', error.message);
            return;
        }
        console.log(`✅ Tabla encontrada con ${count} registros`);
        if (data && data.length > 0) {
            console.log('\n📋 MUESTRA DE DATOS:');
            data.forEach((client, index) => {
                console.log(`   ${index + 1}. Nombre: ${client.name || 'N/A'}`);
                console.log(`      Email: ${client.email || 'N/A'}`);
                console.log(`      Teléfono: ${client.phone_number || 'N/A'}`);
                console.log(`      Documento: ${client.document_id || 'N/A'}`);
                console.log('');
            });
        }
    }
    catch (error) {
        console.log('❌ Error verificando tabla:', error);
    }
}
async function runClientTests() {
    console.log('🚀 PRUEBAS DE IDENTIFICACIÓN DE CLIENTE');
    console.log('='.repeat(60));
    await testTableStructure();
    await testClientIdentification();
    console.log('\n🎯 RESUMEN:');
    console.log('- Verifica que la tabla dentix_clients existe');
    console.log('- Verifica que los números se formatean correctamente');
    console.log('- Verifica que la identificación funciona correctamente');
}
runClientTests();
