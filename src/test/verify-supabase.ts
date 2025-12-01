import { supabase } from '../config/supabase';

async function verifySupabase() {
    console.log('🔍 Verificando conexión a Supabase y tabla payment_logs...');

    try {
        // 1. Intentar leer de la tabla
        const { data, error: selectError } = await supabase
            .from('payment_logs')
            .select('count', { count: 'exact', head: true });

        if (selectError) {
            console.error('❌ Error al leer la tabla payment_logs:');
            console.error(JSON.stringify(selectError, null, 2));
            
            if (selectError.code === '42P01') {
                console.error('💡 Pista: El código 42P01 suele significar que la tabla no existe.');
            }
            return;
        }

        console.log('✅ Conexión exitosa. La tabla existe.');
        console.log(`📊 Registros actuales: ${data}`); // data es null con head:true, pero count viene en la respuesta, supabase js devuelve { count, data, error }

        // Corregimos para obtener count
        const { count } = await supabase
            .from('payment_logs')
            .select('*', { count: 'exact', head: true });
            
        console.log(`📊 Cantidad de registros: ${count}`);

    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }
}

verifySupabase();
