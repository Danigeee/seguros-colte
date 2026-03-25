import { Router, Request, Response } from 'express';
import { processMeFiaFlow } from '../services/mefiaService.js';
import type { MeFiaPayload } from '../types/MeFiaPayload.js';

const router = Router();

// Endpoint que será consumido por la Tool de ElevenLabs
router.post('/webhook/mefia/generar-pdf', async (req: Request<{}, {}, MeFiaPayload>, res: Response): Promise<void> => {
  console.log('[MeFia Route] Request recibida con body:', req.body);
  
  try {
    const data = req.body;
    
    // Validación de seguridad básica
    if (!data.numeroIdentificacion || !data.telefono || !data.nombresApellidos) {
      res.status(400).json({ success: false, error: 'Faltan campos requeridos en el payload.' });
      return; 
    }

    // Ejecutar el servicio asíncrono
    await processMeFiaFlow(data);

    // Responder 200 OK a ElevenLabs para liberar al agente de voz
    res.status(200).json({ 
      success: true, 
      message: 'Documento generado y enviado correctamente vía WhatsApp.' 
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error interno del servidor procesando la solicitud.' 
    });
  }
});

export default router;
