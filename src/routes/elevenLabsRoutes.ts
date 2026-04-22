import { Router, Request, Response } from 'express';
import { processPensionadoHandoff } from '../services/pensionadoHandoffService.js';

const router = Router();

// Endpoint llamado por ElevenLabs cuando un cliente confirma ser pensionado en la llamada.
// Registra el origen en chat_history y envía el template de WhatsApp de continuación.
router.post('/webhook/elevenlabs/pensionado-handoff', async (req: Request, res: Response): Promise<void> => {
  console.log('[ElevenLabs Route] Pensionado handoff recibido:', req.body);

  const { telefono, nombre } = req.body;

  if (!telefono) {
    res.status(400).json({ success: false, error: 'El campo "telefono" es requerido.' });
    return;
  }

  try {
    await processPensionadoHandoff({ telefono, nombre });

    res.status(200).json({
      success: true,
      message: 'Handoff registrado y template de WhatsApp enviado.'
    });
  } catch (error: any) {
    console.error('[ElevenLabs Route] Error en pensionado handoff:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor.'
    });
  }
});

export default router;
