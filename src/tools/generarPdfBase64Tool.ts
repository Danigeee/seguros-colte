import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { googleSheetsService } from "../services/googleSheetsService.js";

/**
 * Store servidor-side para el Base64 del PDF con TTL automático.
 * El agente recibe solo la clave corta (pdfKey), evitando inflar el contexto del LLM
 * con cientos de KB de texto en Base64 en cada mensaje.
 * Los PDFs se eliminan automáticamente tras 15 minutos de inactividad.
 */
class PdfStore {
  private store = new Map<string, { data: string; createdAt: number }>();

  set(key: string, value: string): void {
    this.store.set(key, { data: value, createdAt: Date.now() });
  }
  get(key: string): string | undefined {
    return this.store.get(key)?.data;
  }
  delete(key: string): boolean {
    return this.store.delete(key);
  }
  has(key: string): boolean {
    return this.store.has(key);
  }
  keys(): IterableIterator<string> {
    return this.store.keys();
  }
  get size(): number {
    return this.store.size;
  }
  /** Elimina entradas con más de maxAgeMinutes minutos de antigüedad */
  cleanup(maxAgeMinutes = 15): number {
    const cutoff = Date.now() - maxAgeMinutes * 60_000;
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (entry.createdAt < cutoff) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

export const pdfBase64Store = new PdfStore();

/**
 * Genera el PDF de solicitud "SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO"
 * con los datos del cliente diligenciados y lo retorna en Base64.
 * Diseñado para el flujo de descuento por pensión, donde el PDF
 * debe firmarse electrónicamente a través de Andes en lugar de enviarse por WhatsApp.
 */
export const generarPdfBase64Tool = new DynamicStructuredTool({
    name: "generarPdfBase64Tool",
    description: "Genera el PDF de solicitud 'SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO' con los datos del cliente diligenciados. Úsalo EXCLUSIVAMENTE en el flujo de descuento por pensión, como paso previo a la firma electrónica con Andes. Requiere los 12 datos completos del cliente. Retorna un pdfKey corto — úsalo en el campo documentoBase64 al llamar a firmar_documento.",
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
    func: async (data) => {
        try {
            console.log("[generarPdfBase64Tool] Generando PDF para firma electrónica...");

            const pdfPath = path.resolve(process.cwd(), "docs", "SOLICITUD ASISTENCIA BIENESTAR PLUS PROTEGIDO.pdf");

            if (!fs.existsSync(pdfPath)) {
                throw new Error(`No se encontró el archivo base en: ${pdfPath}`);
            }

            const pdfBytes = fs.readFileSync(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            const fields: Record<string, string> = {
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
                    form.getTextField(key).setText(value);
                } catch (e) {
                    console.warn(`[generarPdfBase64Tool] Campo ${key} no encontrado en PDF (continuando).`);
                }
            }

            const newPdfBytes = await pdfDoc.save();
            const documentoBase64 = Buffer.from(newPdfBytes).toString('base64');

            // Guardamos el Base64 en el store servidor-side y devolvemos solo la clave.
            // Esto evita que el Base64 (cientos de KB) infle el contexto del LLM.
            // Clave estable (sin timestamp) para que firmar_documento la resuelva
            // automáticamente usando solo el número de documento del cliente.
            const pdfKey = `pdf_${data.numeroIdentificacion}`;
            pdfBase64Store.set(pdfKey, documentoBase64);

            // Registrar en Google Sheets igual que el flujo MeFiA
            try {
                await googleSheetsService.appendMeFiaData(data);
                console.log(`[generarPdfBase64Tool] Datos registrados en Google Sheets para ${data.numeroIdentificacion}`);
            } catch (sheetsError: any) {
                console.error("[generarPdfBase64Tool] Error al registrar en Google Sheets:", sheetsError.message);
            }

            console.log(`[generarPdfBase64Tool] PDF listo. Clave: ${pdfKey}`);
            return JSON.stringify({
                success: true,
                mensaje: `PDF generado correctamente para ${data.numeroIdentificacion}. Continúa con el paso de firma Andes (solicitar_certificado).`
            });

        } catch (error: any) {
            console.error("[generarPdfBase64Tool] Error al generar PDF:", error);
            return JSON.stringify({ success: false, error: error.message });
        }
    }
});
