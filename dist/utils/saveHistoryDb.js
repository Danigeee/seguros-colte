// Guardar hustorial de conversación en Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// interface ChatHistory {
//     id: number;
//     client_number: string;
//     messages: ChatMessage[];
// }
// Función para guardar o actualizar el historial del chat
export async function saveChatHistory(clientNumber, newMessage, isClient, newMediaUrl) {
    try {
        const firebaseMediaUrl = newMediaUrl ? newMediaUrl : '';
        // Verificar si el cliente ya tiene un chat
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('id, messages')
            .eq('client_number', clientNumber)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            throw new Error(`Error fetching data: ${fetchError.message}`);
        }
        const newEntry = {
            user: isClient ? 'client_message' : 'agent_message',
            message: newMessage,
            url: firebaseMediaUrl,
            date: new Date().toISOString()
        };
        if (existingChat) {
            // Si el cliente ya tiene un chat, agregar el nuevo mensaje al historial existente
            const updatedMessages = [...existingChat.messages, newEntry];
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ messages: updatedMessages })
                .eq('id', existingChat.id);
            if (updateError) {
                throw new Error(`Error updating data: ${updateError.message}`);
            }
            else {
                console.log('Data updated successfully');
            }
        }
        else {
            // Si el cliente no tiene un chat, crear un nuevo registro con el historial inicial
            const updatedMessages = [newEntry];
            const { error: insertError } = await supabase
                .from('chat_history')
                .insert([
                {
                    client_number: clientNumber,
                    messages: updatedMessages
                }
            ]);
            if (insertError) {
                throw new Error(`Error inserting data: ${insertError.message}`);
            }
            else {
                console.log('Data inserted successfully');
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}
// Función para guardar o actualizar el historial del chat
export async function saveTemplateChatHistory(clientNumber, newMessage, isClient, newMediaUrl, user) {
    try {
        const firebaseMediaUrl = newMediaUrl ? newMediaUrl : '';
        // Verificar si el cliente ya tiene un chat
        const { data: existingChat, error: fetchError } = await supabase
            .from('chat_history')
            .select('id, messages')
            .eq('client_number', clientNumber)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            throw new Error(`Error fetching data: ${fetchError.message}`);
        }
        const newEntry = {
            user: user,
            message: newMessage,
            url: firebaseMediaUrl,
            date: new Date().toISOString()
        };
        if (existingChat) {
            // Si el cliente ya tiene un chat, agregar el nuevo mensaje al historial existente
            const updatedMessages = [...existingChat.messages, newEntry];
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ messages: updatedMessages })
                .eq('id', existingChat.id);
            if (updateError) {
                throw new Error(`Error updating data: ${updateError.message}`);
            }
            else {
                console.log('Data updated successfully');
            }
        }
        else {
            // Si el cliente no tiene un chat, crear un nuevo registro con el historial inicial
            const updatedMessages = [newEntry];
            const { error: insertError } = await supabase
                .from('chat_history')
                .insert([
                {
                    client_number: clientNumber,
                    messages: updatedMessages,
                    chat_on: true
                }
            ]);
            if (insertError) {
                throw new Error(`Error inserting data: ${insertError.message}`);
            }
            else {
                console.log('Data inserted successfully for template');
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}
