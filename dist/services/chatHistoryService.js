import { supabase } from '../config/supabase';
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
