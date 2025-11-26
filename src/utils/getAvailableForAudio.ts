// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);


// Función para consultar si una persona está disponible para mandarle audios
export async function getAvailableForAudio(clientNumber: string) {
    try {
        // Verificar si el cliente ya tiene una conversación
        const { data: existingConversation, error: fetchError } = await supabase
            .from('chat_history')
            .select('audio')
            .eq('client_number', clientNumber)
            .maybeSingle();

        if (fetchError) {
            console.error(`Error fetching data: ${fetchError.message}`);
            return null;
        }    

        if (existingConversation) {
            return existingConversation.audio;
        }

        return null;
    } catch (error) {
        console.error('Error in getAvailableForAudio:', error);
        return null;
    }
}