// src/utils/mediaHandler.ts
import { storage } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { OpenAI, toFile } from "openai";
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProcessedMedia {
  url: string; // URL de Firebase
  type: 'image' | 'audio' | 'document';
  transcription?: string;
  originalName?: string;
}

export async function processTwilioMedia(
  mediaUrl: string,
  contentType: string,
  phoneNumber: string
): Promise<ProcessedMedia> {
  
  console.log(`🔄 Procesando media de Twilio: ${contentType}`);

  // 1. Descargar de Twilio (Usando Auth Basic si es necesario)
  const headers: any = {};
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const response = await fetch(mediaUrl, { headers });
  if (!response.ok) throw new Error('Error descargando de Twilio');
  const buffer = await response.buffer();

  // 2. Determinar Rutas en Firebase
  let folder = 'documents';
  let extension = 'bin';
  let type: 'image' | 'audio' | 'document' = 'document';

  if (contentType.includes('image')) {
    folder = 'images';
    extension = contentType.split('/')[1] || 'jpg';
    type = 'image';
  } else if (contentType.includes('audio')) {
    folder = 'audios';
    extension = contentType.includes('ogg') ? 'ogg' : 'mp3';
    type = 'audio';
  } else if (contentType.includes('pdf')) {
    folder = 'documents';
    extension = 'pdf';
  } else if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
    extension = 'xlsx';
  }

  // Nombre de archivo único
  const fileName = `${folder}/${phoneNumber}_${Date.now()}_${uuidv4()}.${extension}`;
  const storageRef = ref(storage, fileName);

  // Metadatos para Firebase
  const metadata = {
    contentType: contentType,
    customMetadata: {
      phoneNumber: phoneNumber,
      originalUrl: mediaUrl
    }
  };

  // 3. Subir a Firebase Storage
  const uploadTask = await uploadBytesResumable(storageRef, buffer, metadata);
  const firebasePublicUrl = await getDownloadURL(uploadTask.ref);
  
  console.log(`✅ Subido a Firebase: ${firebasePublicUrl}`);

  // 4. Transcripción (Solo Audios)
  let transcription = '';
  if (type === 'audio') {
    try {
      // Convertir buffer a File object para OpenAI
      const file = await toFile(buffer, `audio.${extension}`, { type: contentType });
      
      const transcriptResponse = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'es',
        prompt: "Es una conversación de construcción sobre cotizaciones de concreto."
      });
      transcription = transcriptResponse.text;
      console.log(`🗣️ Transcripción: ${transcription}`);
    } catch (error) {
      console.error('⚠️ Fallo transcripción:', error);
      transcription = '(Audio recibido sin transcripción)';
    }
  }

  return {
    url: firebasePublicUrl,
    type,
    transcription
  };
}