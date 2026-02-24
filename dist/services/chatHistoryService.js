import { supabase } from '../config/supabase.js';
function buildEntry(user, message, url) {
    return {
        user,
        message,
        url,
        date: new Date().toISOString()
    };
}
export class ChatHistoryService {
    async getOrCreateConversation(clientNumber, clientName) {
        try {
            const { data: existing, error: findError } = await supabase
                .from('chat_history')
                .select('*')
                .eq('client_number', clientNumber)
                .single();
            if (existing) {
                console.log('Found existing conversation for:', clientNumber);
                // Convertir messages JSON a array tipado
                let messages = [];
                if (existing.messages && Array.isArray(existing.messages)) {
                    messages = existing.messages;
                }
                const chatHistory = {
                    ...existing,
                    messages: messages
                };
                return chatHistory;
            }
            if (findError && findError.code !== 'PGRST116') {
                console.error('Error finding conversation:', findError);
                throw new Error('Failed to fetch chat history');
            }
            console.log('Creating new conversation for:', clientNumber);
            const { data: newChat, error: createError } = await supabase
                .from('chat_history')
                .insert({
                client_number: clientNumber,
                client_name: clientName || 'Unknown',
                agent_name: 'Lucía - Coltefinanciera Seguros',
                messages: [], // Inicializar con array vacío
                chat_on: false,
                chat_status: 'open'
            })
                .select()
                .single();
            if (createError) {
                console.error('Error creating chat history:', createError);
                throw new Error('Failed to initialize chat history');
            }
            const chatHistory = {
                ...newChat,
                messages: []
            };
            return chatHistory;
        }
        catch (error) {
            console.error('Exception in getOrCreateConversation:', error);
            throw error;
        }
    }
    async saveMessage(params) {
        try {
            console.log('Saving message with params:', {
                conversationId: params.conversationId,
                sender: params.sender,
                messageLength: params.message?.length || 0,
                twilioSid: params.twilioSid,
                type: params.type
            });
            // Primero obtener la conversación actual
            const { data: conversation, error: fetchError } = await supabase
                .from('chat_history')
                .select('id, messages')
                .eq('id', params.conversationId)
                .single();
            if (fetchError) {
                console.error('Error fetching conversation:', fetchError);
                return false;
            }
            // Crear el nuevo mensaje
            const newMessage = {
                user: params.sender === 'user' ? 'client_message' : 'agent_message',
                message: params.message,
                date: new Date().toISOString(),
                url: params.url || ''
            };
            // Obtener mensajes existentes
            let existingMessages = [];
            if (conversation.messages && Array.isArray(conversation.messages)) {
                existingMessages = conversation.messages;
            }
            // Agregar el nuevo mensaje al array existente
            const updatedMessages = [...existingMessages, newMessage];
            // Actualizar la conversación con el nuevo array de mensajes
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ messages: updatedMessages })
                .eq('id', params.conversationId);
            if (updateError) {
                console.error('Error updating chat history:', updateError);
                return false;
            }
            console.log('Message saved successfully to conversation:', params.conversationId);
            return true;
        }
        catch (exception) {
            console.error('Exception saving message:', exception);
            return false;
        }
    }
    async getMessages(conversationId) {
        try {
            const { data: conversation, error } = await supabase
                .from('chat_history')
                .select('messages')
                .eq('id', conversationId)
                .single();
            if (error || !conversation) {
                console.error('Error fetching messages:', error);
                return [];
            }
            return conversation.messages || [];
        }
        catch (exception) {
            console.error('Exception fetching messages:', exception);
            return [];
        }
    }
    async updateMessageStatus(twilioSid, status) {
        // Esta función ya no es necesaria con la nueva estructura
        console.log('Message status update not needed with current structure');
    }
}
export async function saveTemplateChatHistory(clientNumber, newMessage, isClient, // no lo usas, pero lo conservo por firma
newMediaUrl, user) {
    const entry = buildEntry(user, newMessage, newMediaUrl || '');
    /* 1) — intentar INSERTAR la fila nueva */
    const { error: insertError } = await supabase
        .from('chat_history')
        .insert([
        {
            client_number: clientNumber,
            messages: [entry], // primer mensaje
            chat_on: true
        }
    ]);
    /* 2) — ¿hubo error?  */
    if (insertError) {
        const code = insertError.code;
        /* 2.a) — si es 23505, alguien insertó antes; toca UPDATE */
        if (code === '23505') {
            // obtenemos la fila existente
            const { data: chat, error: fetchError } = await supabase
                .from('chat_history')
                .select('id, messages')
                .eq('client_number', clientNumber)
                .single();
            if (fetchError)
                throw fetchError; // algo raro pasó
            const existingMessages = chat.messages;
            const updatedMessages = [...existingMessages, entry];
            const { error: updateError } = await supabase
                .from('chat_history')
                .update({ messages: updatedMessages })
                .eq('id', chat.id);
            if (updateError)
                throw updateError;
            console.log('Mensaje añadido vía UPDATE');
        }
        /* 2.b) — cualquier otro error: propágalo */
        else {
            throw insertError;
        }
    }
    else {
        console.log('Fila creada vía INSERT');
    }
}
