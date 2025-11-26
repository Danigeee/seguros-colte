import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { ChatHistoryService } from '../services/chatHistoryService';
import { processTwilioMedia } from '../utils/mediaHandler';
import { graph } from '../supervisor';
import { HumanMessage } from '@langchain/core/messages';

const router = Router();
const chatService = new ChatHistoryService();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/cemtech/receive-message', async (req: Request, res: Response) => {
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const { Body, From, To, MessageSid, MediaUrl0, MediaContentType0, ProfileName } = req.body;
    const clientNumber = From.replace('whatsapp:', '');
    const botNumber = To.replace('whatsapp:', '');

    console.log(`Mensaje de ${clientNumber} (${ProfileName})`);

    const conversation = await chatService.getOrCreateConversation(clientNumber, ProfileName);

    if (conversation.chat_on) {
      console.log(`[MODO HUMANO] Chat atendido por asesor. IA en pausa.`);
      
      let contentToSave = Body || '';
      let firebaseUrl = null;

      if (MediaUrl0) {
        const mediaData = await processTwilioMedia(MediaUrl0, MediaContentType0, clientNumber);
        firebaseUrl = mediaData.url;
        contentToSave = mediaData.transcription || (mediaData.type === 'image' ? 'Imagen' : 'Archivo');
      }

      await chatService.saveMessage({
        conversationId: conversation.id,
        sender: 'user',
        message: contentToSave,
        twilioSid: MessageSid,
        type: MediaUrl0 ? (MediaContentType0.includes('image') ? 'image' : 'document') : 'text',
        url: firebaseUrl || undefined
      });

      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
      return;
    }

    let finalUserMessage = Body || '';
    let firebaseUrl = null;
    let messageType: 'text' | 'image' | 'audio' | 'document' = 'text';

    if (MediaUrl0) {
      try {
        const mediaData = await processTwilioMedia(MediaUrl0, MediaContentType0, clientNumber);
        firebaseUrl = mediaData.url;
        messageType = mediaData.type;

        if (mediaData.type === 'audio') {
            finalUserMessage = mediaData.transcription || '[Audio ininteligible]';
        } else if (mediaData.type === 'image') {
            finalUserMessage = finalUserMessage || `[Imagen enviada: ${mediaData.url}]`;
        } else {
            finalUserMessage = `[Archivo enviado: ${mediaData.url}]`;
        }
      } catch (e) {
        console.error('Error procesando media:', e);
        finalUserMessage = '[Error al procesar archivo adjunto]';
      }
    }

    await chatService.saveMessage({
        conversationId: conversation.id,
        sender: 'user',
        message: finalUserMessage,
        twilioSid: MessageSid,
        type: messageType,
        url: firebaseUrl || undefined
    });

    console.log(`IA procesando...`);
    
    const config = {
        configurable: {
            thread_id: conversation.id.toString(),
            user_phone: clientNumber
        }
    };

    const inputs = {
        messages: [new HumanMessage(finalUserMessage)]
    };

    const output = await graph.invoke(inputs, config);
    const lastMessage = output.messages[output.messages.length - 1];
    const botResponse = lastMessage.content as string;

    // Detectar si hay URLs de archivos (PDFs, imágenes) en la respuesta para enviarlos como adjuntos
    let mediaUrl: string | undefined;
    // Regex para capturar URLs, deteniéndose ante paréntesis de cierre (común en markdown) o espacios
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const matches = botResponse.match(urlRegex);
    
    if (matches) {
        const potentialMedia = matches.find(url => 
            url.includes('firebasestorage') || 
            url.includes('storage.googleapis.com') ||
            url.endsWith('.pdf') ||
            url.endsWith('.jpg') ||
            url.endsWith('.png')
        );
        
        if (potentialMedia) {
            mediaUrl = potentialMedia;
            console.log(`📎 Adjunto detectado en respuesta: ${mediaUrl}`);
        }
    }

    const sendTo = From.startsWith('whatsapp:') ? From : `whatsapp:${From}`;
    const sendFrom = To.startsWith('whatsapp:') ? To : `whatsapp:${To}`;

    console.log(`Enviando a Twilio: De ${sendFrom} para ${sendTo}`);

    const messageOptions: any = {
        body: botResponse,
        from: sendFrom,
        to: sendTo
    };

    if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
    }

    const sentMsg = await twilioClient.messages.create(messageOptions);

    console.log(`Twilio aceptó el mensaje. SID: ${sentMsg.sid} | Status: ${sentMsg.status}`);

    await chatService.saveMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        message: botResponse,
        twilioSid: sentMsg.sid
    });

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (error) {
    console.error('Error en webhook:', error);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

export default router;