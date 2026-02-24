import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';
import { Tables } from '../types/db.js';

interface ChatMessage {
  user: 'client_message' | 'agent_message' | 'system_message';
  message: string;
  date: string;
  url?: string;
}

interface ChatHistory extends Omit<Tables<'chat_history'>, 'messages'> {
  messages: ChatMessage[];
}

function buildEntry(
    user: 'client_message' | 'agent_message' | 'system_message',
    message: string,
    url: string
  ): ChatMessage {
    return {
      user,
      message,
      url,
      date: new Date().toISOString()
    };
  }


export class ChatHistoryService {

  async getOrCreateConversation(clientNumber: string, clientName?: string): Promise<ChatHistory> {
    try {
      const { data: existing, error: findError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('client_number', clientNumber)
        .single();

      if (existing) {
        console.log('Found existing conversation for:', clientNumber);
        
        // Convertir messages JSON a array tipado
        let messages: ChatMessage[] = [];
        if (existing.messages && Array.isArray(existing.messages)) {
          messages = (existing.messages as unknown) as ChatMessage[];
        }
        
        const chatHistory: ChatHistory = {
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

      const chatHistory: ChatHistory = {
        ...newChat,
        messages: []
      };

      return chatHistory;
    } catch (error) {
      console.error('Exception in getOrCreateConversation:', error);
      throw error;
    }
  }

  async saveMessage(params: {
    conversationId: number;
    sender: 'user' | 'assistant' | 'system'; 
    message: string;
    twilioSid?: string;
    type?: 'text' | 'image' | 'document' | 'audio';
    url?: string;
  }): Promise<boolean> {
    
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
      const newMessage: ChatMessage = {
        user: params.sender === 'user' ? 'client_message' : 'agent_message',
        message: params.message,
        date: new Date().toISOString(),
        url: params.url || ''
      };

      // Obtener mensajes existentes
      let existingMessages: ChatMessage[] = [];
      if (conversation.messages && Array.isArray(conversation.messages)) {
        existingMessages = (conversation.messages as unknown) as ChatMessage[];
      }

      // Agregar el nuevo mensaje al array existente
      const updatedMessages: ChatMessage[] = [...existingMessages, newMessage];

      // Actualizar la conversación con el nuevo array de mensajes
      const { error: updateError } = await supabase
        .from('chat_history')
        .update({ messages: updatedMessages as any })
        .eq('id', params.conversationId);

      if (updateError) {
        console.error('Error updating chat history:', updateError);
        return false;
      }

      console.log('Message saved successfully to conversation:', params.conversationId);
      return true;
      
    } catch (exception) {
      console.error('Exception saving message:', exception);
      return false;
    }
  }

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
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

      return (conversation.messages as unknown as ChatMessage[]) || [];
    } catch (exception) {
      console.error('Exception fetching messages:', exception);
      return [];
    }
  }

  async updateMessageStatus(twilioSid: string, status: string) {
    // Esta función ya no es necesaria con la nueva estructura
    console.log('Message status update not needed with current structure');
  }
}

export async function saveTemplateChatHistory(
    clientNumber: string,
    newMessage: string,
    isClient: boolean,         // no lo usas, pero lo conservo por firma
    newMediaUrl: string,
    user: 'client_message' | 'agent_message' | 'system_message'
  ): Promise<void> {
    const entry = buildEntry(user, newMessage, newMediaUrl || '');
  
    /* 1) — intentar INSERTAR la fila nueva */
    const { error: insertError } = await supabase
      .from('chat_history')
      .insert([
        {
          client_number: clientNumber,
          messages: [entry] as any,   // primer mensaje
          chat_on: true
        }
      ]);
  
    /* 2) — ¿hubo error?  */
    if (insertError) {
      const code = (insertError as PostgrestError).code;
  
      /* 2.a) — si es 23505, alguien insertó antes; toca UPDATE */
      if (code === '23505') {
        // obtenemos la fila existente
        const { data: chat, error: fetchError } = await supabase
          .from('chat_history')
          .select('id, messages')
          .eq('client_number', clientNumber)
          .single();
  
        if (fetchError) throw fetchError;          // algo raro pasó
  
        const existingMessages = (chat!.messages as unknown) as ChatMessage[];
        const updatedMessages = [...existingMessages, entry];
  
        const { error: updateError } = await supabase
          .from('chat_history')
          .update({ messages: updatedMessages as any })
          .eq('id', chat!.id);
  
        if (updateError) throw updateError;
  
        console.log('Mensaje añadido vía UPDATE');
      }
      /* 2.b) — cualquier otro error: propágalo */
      else {
        throw insertError;
      }
    } else {
      console.log('Fila creada vía INSERT');
    }
  }