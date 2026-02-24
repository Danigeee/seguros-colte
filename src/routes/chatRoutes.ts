import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { ChatHistoryService } from '../services/chatHistoryService.js';
import { elevenLabsService } from '../services/elevenLabsService.js';
import { processTwilioMedia } from '../utils/mediaHandler.js';
import { graph } from '../supervisor.js';
import { HumanMessage } from '@langchain/core/messages';
import { fileURLToPath } from 'url';
import path from 'path';
// axios
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { saveTemplateChatHistory } from '../utils/saveHistoryDb.js';

const router = Router();
const chatService = new ChatHistoryService();

const MessagingResponse = twilio.twiml.MessagingResponse; // mandar un texto simple
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken); // mandar un texto con media

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage();

// Ruta de health check
router.get('/seguros-colte/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Seguros Colte API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
   

// Verificar configuración de Twilio
// console.log('🔧 CONFIGURACIÓN TWILIO:');
// console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NO CONFIGURADO'}`);
// console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/seguros-colte/receive-message', async (req: Request, res: Response) => {
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const { Body, From, To, MessageSid, MediaUrl0, MediaContentType0, ProfileName } = req.body;
    const clientNumber = From.replace('whatsapp:', '');
    const botNumber = To.replace('whatsapp:', '');

    console.log(`Mensaje de ${clientNumber} (${ProfileName})`);

    const conversation = await chatService.getOrCreateConversation(clientNumber, ProfileName);

    if (conversation.chat_on) {
      // console.log(`[MODO HUMANO] Chat atendido por asesor. IA en pausa.`);
      
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
    
    let botResponse: string;
    try {
        const config = {
            configurable: {
                thread_id: conversation.id.toString(),
                user_phone: clientNumber
            }
        };

        const inputs = {
            messages: [new HumanMessage(finalUserMessage)]
        };

        console.log(`📋 Invocando grafo con thread_id: ${conversation.id}`);
        
        // Agregar timeout para evitar que se quede colgado
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('⏱️ Timeout: El grafo tardó más de 45 segundos')), 45000);
        });
        
        const graphPromise = graph.invoke(inputs, config);
        const output = await Promise.race([graphPromise, timeoutPromise]) as any;
        
        if (!output || !output.messages || output.messages.length === 0) {
            throw new Error('❌ El grafo no devolvió mensajes válidos');
        }
        
        const lastMessage = output.messages[output.messages.length - 1];
        botResponse = lastMessage.content as string;
        
        if (!botResponse || typeof botResponse !== 'string') {
            throw new Error('❌ La respuesta del bot no es válida');
        }
        
        console.log(`✅ Respuesta generada exitosamente (${botResponse.length} chars)`);
    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN GRAPH.INVOKE:');
        console.error('   Type:', error?.constructor?.name || 'Unknown');
        console.error('   Message:', error instanceof Error ? error.message : String(error));
        console.error('   Stack:', error instanceof Error ? error.stack?.substring(0, 500) : 'No stack');
        
        botResponse = 'Disculpa, hubo un problema técnico momentáneo. ¿Podrías repetir tu consulta? 🔄';
    }

    // Verificar si es el primer mensaje para generar audio
    let audioUrl: string | undefined;
    const conversationMessages = await chatService.getMessages(conversation.id);
    const isFirstMessage = elevenLabsService.isFirstMessage(conversationMessages);
    
    if (isFirstMessage && elevenLabsService.shouldConvertToAudio(botResponse, isFirstMessage)) {
      try {
        console.log('🎵 Generando audio para el primer mensaje...');
        audioUrl = await elevenLabsService.textToSpeech(botResponse);
        console.log('✅ Audio generado exitosamente:', audioUrl);
      } catch (error) {
        console.error('❌ Error generando audio:', error);
        // Continuar sin audio si falla
      }
    }

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

    // console.log(`📱 PREPARANDO ENVÍO A TWILIO:`);
    // console.log(`   From: ${sendFrom}`);
    // console.log(`   To: ${sendTo}`);
    // console.log(`   Message: ${botResponse}`);
    // console.log(`   Message Length: ${botResponse.length}`);

    const messageOptions: any = {
        from: sendFrom,
        to: sendTo
    };

    // Priorizar audio sobre texto para el primer mensaje
    if (audioUrl) {
        console.log('🎵 Enviando mensaje de audio...');
        messageOptions.mediaUrl = [audioUrl];
        messageOptions.body = '🎵 Audio de Lucía'; // Texto descriptivo para el audio
    } else {
        messageOptions.body = botResponse;
        if (mediaUrl) {
            messageOptions.mediaUrl = [mediaUrl];
        }
    }

    const sentMsg = await twilioClient.messages.create(messageOptions);

    // console.log(`✅ TWILIO RESPUESTA:`);
    // console.log(`   SID: ${sentMsg.sid}`);
    // console.log(`   Status: ${sentMsg.status}`);
    // console.log(`   Direction: ${sentMsg.direction}`);
    // console.log(`   Date Created: ${sentMsg.dateCreated}`);
    // console.log(`   From: ${sentMsg.from}`);
    // console.log(`   To: ${sentMsg.to}`);
    
    // Verificar el estado del mensaje después de unos segundos
    setTimeout(async () => {
        try {
            const messageStatus = await twilioClient.messages(sentMsg.sid).fetch();
            // console.log(`🔄 ESTADO DEL MENSAJE ${sentMsg.sid}:`);
            // console.log(`   Status: ${messageStatus.status}`);
            // console.log(`   Error Code: ${messageStatus.errorCode}`);
            // console.log(`   Error Message: ${messageStatus.errorMessage}`);
        } catch (error) {
            console.error('❌ Error verificando estado del mensaje:', error);
        }
    }, 5000);

    await chatService.saveMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        message: botResponse,
        twilioSid: sentMsg.sid
    });

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN WEBHOOK - REINICIO EVITADO:');
    console.error('   Type:', error?.constructor?.name || 'Unknown');
    console.error('   Message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack (first 500 chars):', error instanceof Error ? error.stack?.substring(0, 500) : 'No stack');
    
    // Intentar enviar mensaje de error al usuario
    try {
      const { From, To } = req.body;
      if (From && To) {
        await twilioClient.messages.create({
          from: To,
          to: From,
          body: '⚠️ Sistema temporalmente ocupado. Intenta de nuevo en 30 segundos.'
        });
      }
    } catch (twilioError) {
      console.error('❌ Error adicional enviando mensaje de error:', twilioError);
    }
    
    // Limpiar memoria
    if (global.gc) {
      try {
        global.gc();
        console.log('🧹 Garbage collection ejecutado');
      } catch (gcError) {
        console.error('Error en garbage collection:', gcError);
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// Webhook para recibir estados de entrega de mensajes
router.post('/seguros-colte/message-status', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, From, To, Body } = req.body;
    
    console.log(`📨 ESTADO DEL MENSAJE RECIBIDO:`);
    console.log(`   SID: ${MessageSid}`);
    console.log(`   Status: ${MessageStatus}`);
    console.log(`   From: ${From}`);
    console.log(`   To: ${To}`);
    console.log(`   Body Preview: ${Body ? Body.substring(0, 50) + '...' : 'N/A'}`);
    
    if (ErrorCode) {
      console.log(`❌ ERROR EN MENSAJE:`);
      console.log(`   Error Code: ${ErrorCode}`);
      console.log(`   Error Message: ${ErrorMessage}`);
    }
    
    // Actualizar el estado en la base de datos si es necesario
    await chatService.updateMessageStatus(MessageSid, MessageStatus);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando estado del mensaje:', error);
    res.status(200).send('OK'); // Siempre responder OK a Twilio
  }
});

// Endpoint de prueba para verificar la conexión con Twilio
router.get('/seguros-colte/test-twilio', async (req: Request, res: Response) => {
  try {
    console.log('🧪 INICIANDO PRUEBA DE TWILIO...');
    
    // Verificar configuración
    console.log(`Account SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'NO CONFIGURADO'}`);
    console.log(`Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? 'Configurado' : 'NO CONFIGURADO'}`);
    
    // Probar obtener el account
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    if (!accountSid) throw new Error('TWILIO_ACCOUNT_SID no configurado');
    const account = await twilioClient.api.accounts(accountSid).fetch();
    console.log(`✅ Conexión exitosa a Twilio. Status: ${account.status}`);
    
    // Listar números de WhatsApp disponibles
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 5 });
    console.log(`📞 Números disponibles: ${phoneNumbers.length}`);
    phoneNumbers.forEach(number => {
      console.log(`   ${number.phoneNumber} - ${number.friendlyName}`);
    });
    
    res.json({
      success: true,
      account_status: account.status,
      numbers_available: phoneNumbers.length,
      test_time: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR EN PRUEBA DE TWILIO:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

router.post('/seguros-colte/chat-dashboard', async (req, res) => {
  try {
    const twiml = new MessagingResponse();
    const { clientNumber, newMessage } = req.body;

    const isAudioMessage = await newMessage.includes('https://firebasestorage.googleapis.com/v0/b/ultim-admin-dashboard.appspot.com/o/audios');
    const isFileMessage = await newMessage.includes('https://firebasestorage.googleapis.com/v0/b/ultim-admin-dashboard.appspot.com/o/documents')

    if(isAudioMessage) {
      console.log('Audio message detected');
      // Descargar el archivo desde Firebase
      const audioUrl = newMessage;
      const response = await fetch(audioUrl);
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      const tempDir = path.join(__dirname, '../temp'); // Subir un nivel desde routes
      const tempInputPath = path.join(tempDir, 'tempInput.webm');
      const tempOutputPath = path.join(tempDir, 'tempOutput.mp3');

      // Guardar el archivo temporal
      fs.writeFileSync(tempInputPath, new Uint8Array(audioBuffer));

      // Convertir a formato OGG usando ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .output(tempOutputPath)
          .inputOptions('-f', 'webm')
          .audioCodec('libmp3lame')
          .on('start', (commandLine) => {
            console.log('Comando FFmpeg:', commandLine);
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Subir el audio convertido a Firebase Storage a la capeta audios
      const audioName = `audio_${uuidv4()}.mp3`;
      const storageRef = ref(storage, `ogg/${audioName}`);
      const metadata = {
        contentType: 'audio/mpeg',
      };
      const uploadTask = uploadBytesResumable(storageRef, fs.readFileSync(tempOutputPath), metadata);

      console.log('Nombre creado', audioName);

      // Esperar a que la subida complete y obtener la URL pública
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progreso de la subida (opcional)
          console.log('Upload is in progress...');
        },
        (error) => {
          throw new Error(`Upload failed: ${error.message}`);
        },
        async () => {
          // Subida completada
          const audioUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Audio URL:', audioUrl);
          // Envía el archivo de audio a través de Twilio
          await client.messages.create({
            body: "Audio message",
            to: `whatsapp:${clientNumber}`,
            from: `whatsapp:+5742044840`,
            // from: 'whatsapp:+14155238886', 
            mediaUrl: [audioUrl],
          });
          // Limpiar archivos temporales
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(tempOutputPath);
          console.log('Audio message sent successfully', audioUrl);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }
      );
      
    } else if(isFileMessage) {
      console.log('File message detected');
      const message = await client.messages.create({
        body: 'Mensaje con archivo',
        to: `whatsapp:${clientNumber}`,
        from: `whatsapp:+5742044840`,
        // from: 'whatsapp:+14155238886', 
        mediaUrl: [newMessage],
      });
      console.log('File message sent successfully:', message.sid);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    } else {

      // Enviar mensaje a través de Twilio
      const message = await client.messages.create({
        // from: 'whatsapp:+14155238886', // Número de Twilio de pruebas
        from: `whatsapp:+5742044840`, // Número de Coltefinanciera
        to: `whatsapp:${clientNumber}`,
        body: newMessage
      });

      // Enviar respuesta al frontend
      res.status(200).send({ 
        success: true, 
        message: 'Mensaje enviado exitosamente', 
        sid: message.sid 
      });
    }
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).send({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

// Ruta para enviar una plantilla de WhatsApp
// Body esperado: { to, templateId, user, contentVariables: { "1": "valor1", "2": "valor2", ... } }
router.post('/seguros-colte/send-template', async (req, res) => {
  const { to, templateId, user, contentVariables, name } = req.body;

  if (!to || !templateId) {
    res.status(400).json({ success: false, message: 'Los campos "to" y "templateId" son obligatorios' });
    return;
  }

  const resolvedContentVariables = contentVariables
    ? contentVariables
    : name
      ? { "1": name }
      : undefined;

  try {
    console.log(`Enviando plantilla ${templateId} a ${to}`);

    const message = await client.messages.create({
      from: `whatsapp:+5742044840`,
      // from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      messagingServiceSid: "MG81f7782c09f199d0ddde5d5bf1a25a3d",
      contentSid: templateId,
      ...(resolvedContentVariables && { contentVariables: JSON.stringify(resolvedContentVariables) }),
    });

    console.log('body', message.body);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Obtener el cuerpo del mensaje directamente desde la API de Twilio
    const fetchedMessage = await client.messages(message.sid).fetch();
    const messageBody = fetchedMessage.body;

    console.log('messageBody', messageBody);

    // Guardar el mensaje en la base de datos
    await saveTemplateChatHistory(to, messageBody, false, '', user);

    res.status(200).json({ success: true, message: messageBody, sid: message.sid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al enviar la plantilla', error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

// Ruta para obtener detalles de un mensaje específico por SID
router.get('/seguros-colte/message/:sid', async (req, res) => {
const { sid } = req.params;

try {
  const message = await client.messages(sid).fetch();
  res.status(200).json({ success: true, message });
} catch (error) {
  res.status(500).json({ success: false, message: 'Error al obtener el mensaje', error: error instanceof Error ? error.message : 'An unknown error occurred' });
}
});

export default router;