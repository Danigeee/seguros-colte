/**
 * Funciones compartidas que pueden ser utilizadas por múltiples agentes
 * Estas funciones contienen la lógica de negocio reutilizable
 */
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';
dotenv.config();
// Configurar SendGrid
// Requiere las siguientes variables en .env:
// - SENDGRID_API_KEY: Clave de API de SendGrid
// - SENDGRID_FROM_EMAIL: Email remitente verificado en SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
/**
 * Función para obtener el enlace de pago según el tipo de seguro
 */
const getPaymentLink = (insuranceName) => {
    const normalizedName = insuranceName.toLowerCase().trim();
    const paymentLinks = {
        'bienestar': 'https://links.paymentsway.com.co/13aosv',
        'bienestar plus': 'https://links.paymentsway.com.co/13aosv',
        'mascotas': 'https://links.paymentsway.com.co/no4hlo',
        'soat': 'https://links.paymentsway.com.co/soat', // PLACEHOLDER - Cambiar por el enlace real cuando esté disponible
        'autos': 'https://links.paymentsway.com.co/seguroautos', // PLACEHOLDER - Cambiar por el enlace real cuando esté disponible
        'dentix': 'https://links.paymentsway.com.co/dentix', // PLACEHOLDER - Cambiar por el enlace real cuando esté disponible
        // Agregar más seguros aquí cuando sea necesario
        // 'vida': 'https://links.paymentsway.com.co/vida123',
    };
    return paymentLinks[normalizedName] || 'https://links.paymentsway.com.co/default';
};
/**
 * Función para notificar al supervisor cuando se crea un nuevo enlace de pago
 * Acepta un objeto PaymentFlowRequest para mayor flexibilidad
 */
export const notifySupervisorPaymentLink = async (paymentData, paymentLink) => {
    try {
        const fullName = `${paymentData.firstname || 'N/A'} ${paymentData.lastname || ''}`.trim();
        const productName = paymentData.description || 'Producto no especificado';
        console.log(`📧 NOTIFICANDO AL SUPERVISOR sobre nuevo enlace de pago para: ${fullName} - ${productName}`);
        const msg = {
            to: "legal@ultimmarketing.com",
            cc: ["andres.c@ultimmarketing.com"],
            from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@coltefinanciera.com',
                name: 'Sistema Coltefinanciera'
            },
            subject: `🔔 Nueva Compra: ${productName} - ${fullName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">📋 Nueva Compra Iniciada</h1>
            <h2 style="color: #3498db; font-weight: normal;">Enlace de pago generado</h2>
            <div style="background-color: #e74c3c; color: white; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 18px; font-weight: bold;">
              🛡️ PRODUCTO: ${productName}
            </div>
          </div>

          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">👤 Información del Cliente:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>👤 Nombre:</strong> ${fullName}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>🆔 Identificación:</strong> ${paymentData.identification || 'No disponible'}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>📧 Email:</strong> ${paymentData.email || 'No disponible'}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>📱 Teléfono:</strong> ${paymentData.phone || 'No disponible'}</li>

            </ul>
          </div>

          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; margin-top: 0;">💰 Detalles del Pago:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 12px 0; border-bottom: 2px solid #e74c3c; background-color: #ffeaa7; margin-bottom: 10px; border-radius: 5px; text-align: center;"><strong style="font-size: 16px;">🛡️ SEGURO: ${productName}</strong></li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>💵 Monto Mensual:</strong> $${paymentData.amount ? paymentData.amount.toLocaleString() : 'N/A'} COP</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>🔄 Cuotas:</strong> ${paymentData.totalInstallments || 12} meses</li>
              <li style="padding: 8px 0;"><strong>💰 Total:</strong> $${paymentData.amount ? (paymentData.amount * (paymentData.totalInstallments || 12)).toLocaleString() : 'N/A'} COP</li>
            </ul>
          </div>

          <div style="background-color: white; padding: 25px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">🔗 Enlace Generado:</h3>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace;">
              <a href="${paymentLink}" style="color: #3498db;">${paymentLink}</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 8px;">
            <p style="color: #7f8c8d; margin: 0;">📧 Notificación automática del Sistema Coltefinanciera</p>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 12px;">Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
          </div>
        </div>
      `
        };
        await sgMail.send(msg);
        console.log(`✅ Notificación enviada al supervisor exitosamente`);
        return true;
    }
    catch (error) {
        console.error('❌ Error enviando notificación al supervisor:', error);
        // No lanzar error para no bloquear el flujo principal
        return false;
    }
};
/**
 * Función para enviar enlace de pago por correo electrónico usando SendGrid
 */
export const sendPaymentLinkEmail = async (clientName, clientEmail, insuranceName, clientNumber) => {
    try {
        console.log(`📧 INICIANDO ENVÍO DE EMAIL:`);
        console.log(`   Cliente: ${clientName}`);
        console.log(`   Email: ${clientEmail}`);
        console.log(`   Seguro: ${insuranceName}`);
        console.log(`   Teléfono: ${clientNumber}`);
        // Validar parámetros
        if (!clientEmail || !clientEmail.includes('@')) {
            throw new Error(`Email inválido: ${clientEmail}`);
        }
        // Obtener el enlace de pago específico
        const paymentLink = getPaymentLink(insuranceName);
        console.log(`🔗 Enlace de pago generado: ${paymentLink}`);
        // Configurar el mensaje de correo
        const msg = {
            to: clientEmail,
            cc: ["legal@ultimmarketing.com", "andres.c@ultimmarketing.com"],
            from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@coltefinanciera.com',
                name: 'Coltefinanciera Seguros'
            },
            subject: `🛡️ Finaliza tu compra - Seguro ${insuranceName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">¡Hola ${clientName}! 👋</h1>
            <h2 style="color: #3498db; font-weight: normal;">Tu seguro ${insuranceName} te está esperando</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="font-size: 16px; color: #2c3e50; margin-bottom: 20px;">
              ¡Estás a un paso de proteger lo que más quieres! 🛡️
            </p>
            <p style="font-size: 14px; color: #555; margin-bottom: 20px;">
              Haz clic en el botón de abajo para completar tu pago de forma segura y activar tu seguro <strong>${insuranceName}</strong> inmediatamente.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentLink}" 
                 style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
                💳 PAGAR AHORA
              </a>
            </div>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #27ae60; margin-top: 0;">✅ ¿Por qué elegir ${insuranceName}?</h3>
            <ul style="color: #2c3e50; padding-left: 20px;">
              <li>Protección inmediata desde el primer pago</li>
              <li>Cobertura completa para tu tranquilidad</li>
              <li>Atención personalizada 24/7</li>
              <li>Proceso 100% digital y seguro</li>
            </ul>
          </div>
          
          <div style="border-top: 2px solid #ecf0f1; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 5px;">
              <strong>Coltefinanciera Seguros</strong> - Protegiendo lo que más valoras
            </p>
            <p style="font-size: 12px; color: #7f8c8d;">
              ¿Tienes preguntas? Responde este correo o contáctanos por WhatsApp
            </p>
          </div>
        </div>
      `,
            text: `
        ¡Hola ${clientName}!
        
        Tu seguro ${insuranceName} te está esperando.
        
        Completa tu pago en: ${paymentLink}
        
        ¡Protege lo que más quieres hoy mismo!
        
        Coltefinanciera Seguros
      `
        };
        // Verificar configuración de SendGrid
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY no configurada en variables de entorno');
        }
        console.log(`📨 Enviando correo con SendGrid...`);
        console.log(`   To: ${msg.to}`);
        console.log(`   From: ${msg.from.email}`);
        console.log(`   Subject: ${msg.subject}`);
        // Enviar el correo
        const result = await sgMail.send(msg);
        console.log(`✅ Correo enviado exitosamente. Status: ${result[0]?.statusCode || 'N/A'}`);
        // Actualizar chat_history
        try {
            console.log(`Actualizando payment_link_sent_at para el cliente ${clientNumber}`);
            const { error } = await supabase
                .from('chat_history')
                .update({ payment_link_sent_at: new Date().toISOString() })
                .eq('client_number', clientNumber);
            if (error) {
                console.error("Error actualizando chat_history:", error);
            }
            else {
                console.log("chat_history actualizado exitosamente");
            }
        }
        catch (dbError) {
            console.error("Excepción al actualizar base de datos:", dbError);
        }
        return `✅ Enlace de pago enviado exitosamente a ${clientEmail}. El cliente ${clientName} recibirá instrucciones para completar la compra de ${insuranceName}.`;
    }
    catch (error) {
        console.error("❌ ERROR CRÍTICO AL ENVIAR ENLACE DE PAGO:");
        console.error("   Type:", error?.constructor?.name || 'Unknown');
        console.error("   Message:", error?.message || String(error));
        // Manejo específico de errores de SendGrid
        if (error.response) {
            console.error("   SendGrid Status:", error.response.status);
            console.error("   SendGrid Body:", JSON.stringify(error.response.body, null, 2));
        }
        // Log adicional para debugging
        console.error("   Stack (first 300 chars):", error?.stack?.substring(0, 300));
        return `❌ Error técnico al enviar el enlace de pago: ${error?.message || 'Error desconocido'}. Por favor, verifica la dirección de correo e intenta nuevamente.`;
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIÓN DE DOCUMENTO FIRMADO
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Mapa de SIDs de plantilla Twilio (y canales directos) al canal/descripción
 * de contacto correspondiente que se incluirá en el correo de notificación.
 */
export const TEMPLATE_SID_CHANNEL_MAP = {
    'HX5755ee032cc78fab1940d6c71c3111a8': 'WhatsApp - Plantilla MeFía (Bienestar Plus)',
    'DIRECT_WHATSAPP': 'WhatsApp - Mensaje Directo (Bienestar Plus)',
};
// Almacenamiento en memoria del canal usado por teléfono (evita depender de columna DB)
const _documentChannelStore = new Map();
// Deduplicación: guarda el timestamp del último envío de notificación por teléfono
const _lastNotificationTs = new Map();
const _DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
/**
 * Guarda el canal de contacto utilizado para enviarle el documento al cliente
 * en memoria para recuperarlo cuando devuelva el documento firmado.
 */
export const saveDocumentChannel = async (clientPhone, templateSidOrChannel) => {
    try {
        const channelDescription = TEMPLATE_SID_CHANNEL_MAP[templateSidOrChannel] || templateSidOrChannel;
        _documentChannelStore.set(clientPhone, channelDescription);
        console.log(`[saveDocumentChannel] Canal guardado en memoria para ${clientPhone}: ${channelDescription}`);
    }
    catch (err) {
        console.error('[saveDocumentChannel] Excepción al guardar canal:', err);
    }
};
/**
 * Envía un correo de notificación a daniel@ultimmarketing.com cuando un usuario
 * devuelve un documento PDF firmado por WhatsApp.
 * Usa Resend (notification@ultim.pro) con deduplicación para evitar envíos múltiples.
 */
export const notifySignedDocumentReceived = async (clientName, clientPhone) => {
    try {
        // Deduplicación: omitir si ya se notificó en los últimos 5 minutos
        const lastTs = _lastNotificationTs.get(clientPhone);
        if (lastTs && (Date.now() - lastTs) < _DEDUP_WINDOW_MS) {
            console.log(`[notifySignedDocumentReceived] Omitido (duplicado reciente) para ${clientPhone}`);
            return;
        }
        _lastNotificationTs.set(clientPhone, Date.now());
        const channelDescription = _documentChannelStore.get(clientPhone) || 'Canal no identificado';
        const { data: chatHistory } = await supabase
            .from('chat_history')
            .select('client_name')
            .eq('client_number', clientPhone)
            .single();
        const nameToUse = clientName || chatHistory?.client_name || 'Desconocido';
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: resendError } = await resend.emails.send({
            from: 'notification@ultim.pro',
            to: 'daniel@ultimmarketing.com',
            subject: `📄 Documento firmado recibido - ${nameToUse}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">📄 Documento Firmado Recibido</h1>
            <h2 style="color: #27ae60; font-weight: normal;">Una persona acaba de diligenciar y firmar el documento</h2>
          </div>
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">👤 Información del Cliente:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>👤 Nombre completo:</strong> ${nameToUse}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><strong>📱 Teléfono:</strong> ${clientPhone}</li>
              <li style="padding: 8px 0;"><strong>📲 Canal de contacto:</strong> ${channelDescription}</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #ecf0f1; border-radius: 8px;">
            <p style="color: #7f8c8d; margin: 0;">📧 Notificación automática del Sistema Coltefinanciera</p>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 12px;">Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
          </div>
        </div>
      `
        });
        if (resendError) {
            console.error('❌ [notifySignedDocumentReceived] Error de Resend:', resendError);
        }
        else {
            console.log(`✅ [notifySignedDocumentReceived] Notificación enviada a daniel@ultimmarketing.com para cliente ${clientPhone}`);
        }
    }
    catch (error) {
        console.error('❌ [notifySignedDocumentReceived] Error al enviar notificación:', error);
    }
};
