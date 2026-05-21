import { Router, Request, Response } from 'express';

const router = Router();

// Endpoint desactivado: el flujo de pensionados fue migrado a un proyecto independiente.
// Retorna 410 Gone para que ElevenLabs sea actualizado a apuntar al nuevo proyecto.
router.post('/webhook/elevenlabs/pensionado-handoff', (_req: Request, res: Response): void => {
  console.warn('[ElevenLabs Route] Endpoint desactivado — flujo pensionado migrado al proyecto independiente.');
  res.status(410).json({
    success: false,
    error: 'Este endpoint fue migrado. Actualice la configuración de ElevenLabs al nuevo proyecto.'
  });
});

export default router;
