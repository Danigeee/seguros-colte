import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PDFDocument, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { storageService } from "../services/storageService.js";
import { whatsappService } from "../services/whatsappService.js";
import { googleSheetsService } from "../services/googleSheetsService.js";
import { AgentState } from "../agents/agentState.js";
import { saveDocumentChannel } from "../functions/sharedFunctions.js";

export const procesarPagoMeFiaTool = new DynamicStructuredTool({
    name: "procesarPagoMeFiaTool",
    description: "Genera el documento PDF de solicitud para el pago con tarjeta 'Me fía' y se lo envía al usuario por WhatsApp para que lo firme. Solo debe usarse cuando se tienen todos los 12 datos completos del cliente.",
    schema: z.object({
        nombresApellidos: z.string().describe("Nombres y apellidos completos del titular"),
        tipoIdentificacion: z.string().describe("Tipo de identificación (CC, CE, etc.)"),
        numeroIdentificacion: z.string().describe("Número del documento de identidad"),
        fechaNacimiento: z.string().describe("Fecha de nacimiento del titular"),
        lugarNacimiento: z.string().describe("Lugar de nacimiento"),
        sexo: z.string().describe("Sexo del titular (Masculino, Femenino, etc.)"),
        direccionResidencia: z.string().describe("Dirección de residencia completa"),
        ciudad: z.string().describe("Ciudad de residencia"),
        departamento: z.string().describe("Departamento de residencia"),
        paisResidencia: z.string().describe("País de residencia"),
        telefono: z.string().describe("Número de teléfono o celular"),
        email: z.string().email().describe("Correo electrónico del titular")
    }),
    func: async (data, runManager, config) => {
        const state: any = config?.configurable?.state || {};
        try {
            console.log("Iniciando generación de PDF Me Fía con datos:", data);

            // 1. Ruta del archivo PDF original
            const pdfPath = path.resolve(process.cwd(), "docs", "SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO.pdf");
            const pdfBytes = fs.readFileSync(pdfPath);

            // 2. Cargar el documento PDF
            const pdfDoc = await PDFDocument.load(pdfBytes);
            // 3. Fill the AcroForm fields
            const form = pdfDoc.getForm();

            // Fila 1
            form.getTextField('text_1kzjk').setText(data.nombresApellidos);
            form.getTextField('text_8kact').setText(data.direccionResidencia);

            // Fila 2
            form.getTextField('text_3rnud').setText(data.tipoIdentificacion);
            form.getTextField('text_9eidj').setText(data.ciudad);

            // Fila 3
            form.getTextField('text_4kffr').setText(data.numeroIdentificacion);
            form.getTextField('text_10cjsk').setText(data.departamento);

            // Fila 4
            form.getTextField('text_5jqid').setText(data.fechaNacimiento);
            form.getTextField('text_11ujbq').setText(data.paisResidencia);

            // Fila 5
            form.getTextField('text_6mmdx').setText(data.lugarNacimiento);
            form.getTextField('text_12mngf').setText(data.telefono);

            // Fila 6
            form.getTextField('text_7xjip').setText(data.sexo);
            form.getTextField('text_13myjl').setText(data.email);

            // 4. Guardar el nuevo PDF generado en buffer
            const newPdfBytes = await pdfDoc.save();
            const pdfBuffer = Buffer.from(newPdfBytes);

            // 5. Subir a Firebase/Storage para obtener un enlace público
            const timestamp = Date.now();
            const destinationPath = `mefia_requests/${data.numeroIdentificacion}/${timestamp}_solicitud.pdf`;
            const publicUrl = await storageService.uploadPdfToFirebase(pdfBuffer, destinationPath);
            console.log(`PDF subido exitosamente a: ${publicUrl}`);

            // 6. Obtener el número de teléfono con formato internacional (de config o agregando el +57)
            const rawPhone = config?.configurable?.user_phone || data.telefono;
            const phoneNumber = rawPhone.startsWith('+') ? rawPhone : `+57${rawPhone}`;

            // 7. Enviar por WhatsApp usando el servicio existente
            await whatsappService.sendMessage(
                phoneNumber,
                `¡Hola ${data.nombresApellidos.split(' ')[0]}! Aquí tienes tu documento de solicitud para pago con tarjeta "Me fía". Por favor, revísalo, fírmalo y devuélvemelo por este medio para continuar.`,
                publicUrl
            );

            // Guardar el canal de contacto para notificar cuando el cliente devuelva el documento firmado
            await saveDocumentChannel(phoneNumber, 'DIRECT_WHATSAPP');

            // 8. Guardar los datos también en Google Sheets
            try {
                await googleSheetsService.appendMeFiaData(data);
                console.log("Datos de solicitud Me Fía insertados exitosamente en Google Sheets.");
            } catch (sheetError) {
                console.error("Advertencia: No se pudieron guardar los datos en Google Sheets, pero el PDF sí se envió por WhatsApp:", sheetError);
                // No relanzamos el error porque el PDF ya se generó y se envió al cliente
            }

            // 9. Retornar mensaje de éxito al Agente IA
            return `PDF generado y enviado exitosamente al cliente al número ${phoneNumber}. Dile al usuario que revise el documento enviado, lo firme y lo devuelva por este medio.`;

        } catch (error: any) {
            console.error("Error al generar o enviar el PDF de Me Fía:", error);
            return `Hubo un error técnico al generar el PDF: ${error.message}. Pide disculpas al usuario e indícale que intente más tarde.`;
        }
    }
});
