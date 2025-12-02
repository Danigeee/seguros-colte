import axios from 'axios';
import { storage } from '../config/firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Voice ID de Lucía (voz femenina en español)  
const LUCIA_VOICE_ID = "GO3JA3hIYgix20rA5CvN"; //  puedes cambiar por otra

export class ElevenLabsService {
  
  /**
   * Convierte texto a audio usando ElevenLabs
   */
  async textToSpeech(text: string): Promise<string> {
    try {
      console.log('🎤 Generando audio con ElevenLabs:', text.substring(0, 50) + '...');
      
      // Llamar a la API de ElevenLabs directamente
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${LUCIA_VOICE_ID}`,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY!
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBuffer = Buffer.from(response.data);
      
      // Subir a Firebase Storage
      const fileName = `audio_${uuidv4()}.mp3`;
      const storageRef = ref(storage, `lucia_audios/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, audioBuffer, {
        contentType: 'audio/mpeg'
      });

      // Obtener URL de descarga pública
      const publicUrl = await getDownloadURL(uploadResult.ref);
      
      console.log('✅ Audio generado y subido:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('❌ Error generando audio con ElevenLabs:', error);
      throw error;
    }
  }

  /**
   * Detecta si es el primer mensaje de una conversación
   * Verifica que NO haya mensajes previos del asistente en toda la conversación
   */
  isFirstMessage(messages: any[]): boolean {
    // Filtramos mensajes del asistente/agente (respuestas de la IA)
    const agentMessages = messages.filter(msg => msg.user === 'agent_message');
    
    // Solo es primer mensaje si NO hay respuestas previas del agente
    console.log(`🔍 Verificando primer mensaje: ${agentMessages.length} mensajes previos del agente`);
    return agentMessages.length === 0;
  }

  /**
   * Verifica si un texto debe convertirse a audio
   * Criterios: primer mensaje y no muy largo
   */
  shouldConvertToAudio(text: string, isFirst: boolean): boolean {
    return isFirst && text.length <= 500; // Solo primer mensaje y no muy largo
  }
}

export const elevenLabsService = new ElevenLabsService();