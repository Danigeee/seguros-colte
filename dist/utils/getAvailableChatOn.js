// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// Función para consultar si el chat está activado para atención por IA
export async function getAvailableChatOn(clientNumber) {
    try {
        // Verificar si el cliente ya tiene una conversación
        const { data: existingConversation, error: fetchError } = await supabase
            .from('chat_history')
            .select('chat_on')
            .eq('client_number', clientNumber)
            .maybeSingle();
        if (fetchError) {
            console.error(`Error fetching data: ${fetchError.message}`);
            return null;
        }
        if (existingConversation) {
            return existingConversation.chat_on;
        }
        return null;
    }
    catch (error) {
        console.error('Error in getAvailableChatOn:', error);
        return null;
    }
}
