import { Router, Request, Response } from 'express';
import { generatePaymentLinkFlow } from '../services/paymentsWayService.js';
import { PaymentFlowRequest } from '../types/paymentsWay.js';

const router = Router();

router.post('/create-link', async (req: Request<{}, {}, PaymentFlowRequest>, res: Response) => {
  try {
    const { 
      firstname, 
      lastname, 
      identification, 
      email, 
      phone, 
      amount, 
      description,
      clientId,
      totalInstallments
    } = req.body;

    // Validaciones básicas
    if (!firstname || !lastname || !identification || !email || !phone || !amount || !description || !clientId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const paymentData: PaymentFlowRequest = {
      firstname,
      lastname,
      identification,
      email,
      phone,
      amount,
      description,
      clientId,
      totalInstallments
    };

    const paymentLink = await generatePaymentLinkFlow(paymentData);

    res.status(200).json({ 
      success: true, 
      paymentLink 
    });

  } catch (error) {
    console.error('Error in /create-link route:', error);
    res.status(500).json({ error: 'Internal server error processing payment link' });
  }
});

export default router;
