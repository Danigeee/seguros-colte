import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import twilioClient from '../config/twilioConfig.js';
import { storageService } from './storageService.js';
import { googleSheetsService } from './googleSheetsService.js';
import { saveDocumentChannel } from '../functions/sharedFunctions.js';
export { processMeFiaFlow };
const processMeFiaFlow = async (data) => {
    try {
        console.log('[MeFiaService] DUPLICANDO LÓGICA DE procesarPagoMeFiaTool PARA ELEVENLABS...');
        // 1. GENERACIÓN DEL PDF (COPIADO EXACTAMENTE DE procesarPagoMeFiaTool.ts)
        const pdfPath = path.resolve(process.cwd(), "docs", "SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO.pdf");
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`[MeFiaService] No se encontró el archivo base en: ${pdfPath}`);
        }
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        // Mapeo idéntico:
        const fields = {
            'text_1kzjk': data.nombresApellidos,
            'text_8kact': data.direccionResidencia,
            'text_3rnud': data.tipoIdentificacion,
            'text_9eidj': data.ciudad,
            'text_4kffr': data.numeroIdentificacion,
            'text_10cjsk': data.departamento,
            'text_5jqid': data.fechaNacimiento,
            'text_11ujbq': data.paisResidencia,
            'text_6mmdx': data.lugarNacimiento,
            'text_12mngf': data.telefono,
            'text_7xjip': data.sexo,
            'text_13myjl': data.email
        };
        for (const [key, value] of Object.entries(fields)) {
            try {
                const field = form.getTextField(key);
                field.setText(value);
            }
            catch (e) {
                console.warn(`[MeFiaService] Campo ${key} no encontrado en PDF (continuando).`);
            }
        }
        const newPdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(newPdfBytes);
        // Subir a Firebase (Ruta diferenciada para saber que vino de ElevenLabs)
        const timestamp = Date.now();
        const destinationPath = `mefia_elevenlabs/${data.numeroIdentificacion}/${timestamp}_solicitud.pdf`;
        const fileUrl = await storageService.uploadPdfToFirebase(pdfBuffer, destinationPath);
        console.log(`[MeFiaService] PDF duplicado generado: ${fileUrl}`);
        // --- VALIDACIÓN DE URL PÚBLICA ---
        // Si el usuario ve un PDF en blanco en su WhatsApp,
        // ESTE link contiene la prueba de que el código SÍ generó el archivo con datos.
        // Si este link tiene datos y el WhatsApp no, es porque el Template de Twilio
        // está configurado con un "Media Estático" (siempre envía el mismo archivo)
        // en lugar de aceptar uno dinámico.
        console.log(`[MeFiaService] IMPORTANTE: Verifica este link para confirmar datos: ${fileUrl}`);
        // -------------------------
        // 2. ENVÍO WHATSAPP (ÚNICA DIFERENCIA: TEMPLATE OBLIGATORIO)
        // -------------------------
        // Normalización estricta del teléfono
        let phoneDigits = data.telefono.replace(/\D/g, ''); // Solo dígitos
        if (!phoneDigits.startsWith('57') && phoneDigits.length === 10) {
            phoneDigits = `57${phoneDigits}`;
        }
        const numeroDestino = `whatsapp:+${phoneDigits}`;
        // Número Origen OFICIAL (Hardcodeado para seguridad, como pediste)
        const numeroOrigen = "whatsapp:+5742044840";
        console.log(`[MeFiaService] Enviando Template a ${numeroDestino} desde ${numeroOrigen}...`);
        // Usamos el NUEVO Template Dinámico proporcionado
        // Template SID: HX5755ee032cc78fab1940d6c71c3111a8
        const message = await twilioClient.messages.create({
            from: numeroOrigen,
            to: numeroDestino,
            contentSid: 'HX5755ee032cc78fab1940d6c71c3111a8',
            contentVariables: JSON.stringify({
                '1': data.nombresApellidos, // {{1}} = Nombre
                '2': fileUrl // {{2}} = URL del PDF (Media Header)
            }),
            // Con Content API y variables numeradas, mediaUrl suele ser redundante
            // pero lo dejamos por si acaso el template fallara en mode hybrid.
            // Aunque lo CRÍTICO aquí es la variable '2'.
        });
        console.log(`[MeFiaService] Template enviado correctamente. SID: ${message.sid}`);
        // Guardar el canal de contacto para notificar cuando el cliente devuelva el documento firmado
        await saveDocumentChannel(`+${phoneDigits}`, 'HX5755ee032cc78fab1940d6c71c3111a8');
        // 3. GUARDAR EN GOOGLE SHEETS
        try {
            await googleSheetsService.appendMeFiaData(data);
            console.log("[MeFiaService] Datos de solicitud Me Fía insertados exitosamente en Google Sheets.");
        }
        catch (sheetError) {
            console.error("[MeFiaService] Advertencia: No se pudieron guardar los datos en Google Sheets, pero el WhatsApp sí se envió:", sheetError);
        }
    }
    catch (error) {
        console.error('[MeFiaService] Error crítico:', error);
        throw error;
    }
};
