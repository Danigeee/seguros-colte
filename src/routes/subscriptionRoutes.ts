import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase";

const router = Router();

interface CreateSubscriptionRequest {
  idCliente: number;
  idPersonPaWay: string;
  idPlanPaWay: string;
}

interface PaWayPayload {
  referencia: string;
  idform: string;
  idterminal: string;
  idperson: string;
  idplan: string;
  initialDate: string; // Aquí el formato debe ser YYYY-MM-DD
  additionalData: object;
  idservice: number;
  iddebitopersona: string;
}

// Estas peticiones según la documentación de Payments Way requieren autenticación mediante un token en el header Authorization
const PAWAY_API_URL = `${process.env.PAYMENTS_URL}/ClientAPI/CrearSuscripcion`;
const PAWAY_API_TOKEN = process.env.PAYMENTS_WAY_TOKEN;

router.post(
  "/payments-way/create-subscription",
  async (
    req: Request<{}, {}, CreateSubscriptionRequest>,
    res: Response
  ): Promise<any> => {
    try {
        // 1. Recibir y validar datos básicos para poder hacer la petición a Payments Way
        const { idCliente, idPersonPaWay, idPlanPaWay } = req.body; // Esto se tiene que pasar a la IA para que haga la petición

        if (!idCliente || !idPersonPaWay || !idPlanPaWay) {
          return res.status(400).json({
            success: false,
            message: "Faltan datos: idCliente, idPersonPaWay o idPlanPaWay",
          });
        }

        // 2. Preparar datos para la petición a Payments Way
        const uniqueRef = `SUB-${idCliente}-${Date.now()}`; // Referencia única para la suscripción
        const today = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD

        const paWayPayload: PaWayPayload = {
            referencia: uniqueRef,
            idform: "583", // Formulario de suscripción
            idterminal: "560",
            idperson: idPersonPaWay,
            idplan: idPlanPaWay,
            initialDate: today,
            additionalData: {},
            idservice: 1, // ID numérico del servicio
            iddebitopersona: "",
        };

        console.log("Enviando petición a Payments Way:", uniqueRef);

        // 3. Llamada a la API de Payments Way para crear la suscripción
        const response = await fetch(PAWAY_API_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PAWAY_API_TOKEN}`,
            },
            body: JSON.stringify(paWayPayload),
        });

        const paymentsData = await response.json();

        // 4. Verificar si Payments Way respondió con error primero
        const isPaWayError = !paymentsData.ok || (paymentsData.status && paymentsData.status !== 200);

        if (isPaWayError) {
            console.error("Error de Payments Way:", paymentsData);
            return res.status(400).json({
                success: false,
                message: "Payments Way rechazó la creación de la suscripción",
                details: paymentsData,
            });
        }

        // 5. Guardar la suscripción en la base de datos local (Supabase)
        const subscriptionId = paymentsData.data?.id || paymentsData.id || 'PENDING';

        const { error: dbError } = await supabase
            .from('suscripciones')
            .insert({
                client_id: idCliente,
                vepay_subscription_id: String(subscriptionId),
                vepay_referencia: uniqueRef,
                plan_id: idPlanPaWay,
                estado: 'activa',
                response_data: paymentsData,
            });

        if (dbError) {
            console.error("Error guardando la suscripción en Supabase:", dbError);
        }

        // 6. Respuesta final exitosa
        return res.status(200).json({
            success: true,
            message: "Suscripción creada exitosamente",
            data: {
                reference: uniqueRef,
                subscriptionId: subscriptionId
            }
        });

    } catch (error: any) {
      console.error("Error al crear la suscripción:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear la suscripción",
        error: error.message
      });
    }
});

export default router;