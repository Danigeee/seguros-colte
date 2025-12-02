// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// import { exportedFromNumber } from '../routes/chatRoutes.js'; // TODO: Fix export
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// Función para para actualizar el client_name en la base de datos en la tabla chat_history.
export async function setChatHistoryName(clientName, clientNumber) {
    try {
        // Verificar que tenemos un número de teléfono válido
        if (!clientNumber) {
            console.error('No phone number available to update chat history name');
            return;
        }
        console.log(`Attempting to update chat history name for: ${clientNumber}`);
        // Verificar si el cliente ya tiene una conversación
        const { data: existingConversation, error: fetchError } = await supabase
            .from('chat_history')
            .select('id')
            .eq('client_number', clientNumber)
            .maybeSingle();
        if (fetchError) {
            throw new Error(`Error fetching data: ${fetchError.message}`);
        }
        if (existingConversation) {
            // Si el cliente ya tiene una conversación, actualizar el nombre del cliente
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ client_name: clientName })
                .eq('id', existingConversation.id);
            if (updateError) {
                throw new Error(`Error updating data: ${updateError.message}`);
            }
            else {
                console.log('Client name updated successfully');
            }
        }
        else {
            console.log(`No existing conversation found for ${clientNumber}, skipping name update`);
        }
    }
    catch (error) {
        console.error('Error in setChatHistoryName:', error);
    }
}
