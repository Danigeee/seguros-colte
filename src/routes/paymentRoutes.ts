import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

interface PaymentWebhookBody {
    id: string;
    amount: number;
    externalorder: string;
    ip?: string;
    fullname: string;
    jsonresponse?: string;
    additionaldata?: any;
    idstatus: {
        id: number;
        nombre: string;
    };
    idperson?: {
        id?: string;
        firstname?: string;
        lastname?: string;
        identification?: string;
        email?: string;
        phone?: string;
    };
    paymentmethod?: {
        id?: number;
        nombre: string;
        typeCard?: string;
    };
    idsubscripcion?: string | null;
    idmerchant?: string;
    innerexception?: any;
}

router.post('/payments-way/webhook', async (req: Request<{}, {}, PaymentWebhookBody>, res: Response) =>{
    try {
        // Validación del Token de Autorización (Header)
        const authHeader = req.headers.authorization;
        const expectedToken = process.env.PAYMENTS_WAY_TOKEN;

        // Si existe la variable de entorno, validamos que el token coincida
        if (expectedToken) {
            if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
                console.warn('Intento de acceso no autorizado al webhook:', authHeader);
                res.status(401).send('Unauthorized');
                return;
            }
        } else {
            console.warn('ADVERTENCIA: PAYMENTS_WAY_TOKEN no está configurado. Se está omitiendo la validación de seguridad del webhook.');
        }

        const data = req.body;

        // Validación básica para evitar crash si idstatus no viene
        if (!data || !data.idstatus) {
            console.error('Webhook recibido con datos incompletos:', data);
            res.status(400).send('Invalid payload');
            return;
        }

        // Manejo de posible typo en la documentación (ammount vs amount)
        const amountVal = data.amount || (data as any).ammount;

        // Desestructuración de datos
        const {
            id: transactionId,
            externalorder: orderId,
            fullname,
            idstatus,
            idperson,
            paymentmethod
        } = data;

        console.log(`Registrando pago de orden ${orderId} - Estado: ${idstatus.nombre}`);

        // Búsqueda de cliente existente en dentix_clients
        let userId: number | null = null;

        if (idperson) {
            // 1. Intentar buscar por Email
            if (idperson.email) {
                const { data: clientByEmail } = await supabase
                    .from('dentix_clients')
                    .select('id')
                    .eq('email', idperson.email)
                    .maybeSingle();
                
                if (clientByEmail) {
                    userId = clientByEmail.id;
                    console.log(`Cliente encontrado por email: ${idperson.email} (ID: ${userId})`);
                }
            }

            // 2. Si no se encontró por email, intentar por teléfono
            if (!userId && idperson.phone) {
                const { data: clientByPhone } = await supabase
                    .from('dentix_clients')
                    .select('id')
                    .eq('phone_number', idperson.phone)
                    .maybeSingle();
                
                if (clientByPhone) {
                    userId = clientByPhone.id;
                    console.log(`Cliente encontrado por teléfono: ${idperson.phone} (ID: ${userId})`);
                }
            }
        }

        // 1. Insertar en Supabase
        const { error: dbError } = await supabase
            .from('payment_logs')
            .insert({
                order_id: orderId,
                transaction_id: transactionId,
                amount: amountVal,
                status_id: idstatus.id,
                status_name: idstatus.nombre,
                payer_email: idperson?.email,
                payer_phone: idperson?.phone,
                payer_name: fullname,
                payment_method: paymentmethod?.nombre,
                raw_response: data as any, // Aquí se guardará el JSON completo para mayor seguridad.
                user_id: userId
            });
        
        // Aquí agregámos una validación de error en Supabase
        if (dbError) {
            console.error('Error guardando en Supabase: ', dbError);
            res.status(500).json({ error: 'Error guardando en base de datos', details: dbError });
            return;
        };

        // 2. Validación de respuesta si es exitosa
        if ( idstatus.id === 34 ) {
            console.log('Pago Exitoso procesado ✅')
            res.status(200).send('OK');
            return;
        }

        // Si es diferente de 200, es decir, si es rechazada, fallida, etc.
        res.status(201).send('Received');

    } catch (error) {
        console.log('Error crítico en el webhook: ', error);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta Health Check para el webhook
router.get('/payments-way/webhook/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        message: 'Payments Way Webhook is running properly.'
    });
});

export default router;