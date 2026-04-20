import { supabase } from '../config/supabase.js';
import { Database } from '../types/db.js';

export type PensionadoData = Database['public']['Tables']['pensionados_datos']['Row'];

export async function getPensionadoByCedula(cedula: string): Promise<PensionadoData | null> {
  const cedulaLimpia = cedula.trim().replace(/\D/g, '');
  const { data, error } = await supabase
    .from('pensionados_datos')
    .select('*')
    .eq('cedula', cedulaLimpia)
    .single();

  if (error || !data) return null;
  return data;
}
