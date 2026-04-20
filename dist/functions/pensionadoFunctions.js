import { supabase } from '../config/supabase.js';
export async function getPensionadoByCedula(cedula) {
    const cedulaLimpia = cedula.trim().replace(/\D/g, '');
    const { data, error } = await supabase
        .from('pensionados_datos')
        .select('*')
        .eq('cedula', cedulaLimpia)
        .single();
    if (error || !data)
        return null;
    return data;
}
