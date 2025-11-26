import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/db'; 
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan credenciales de Supabase en el archivo .env (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);