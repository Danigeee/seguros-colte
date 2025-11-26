import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { pdfService } from "../services/pdfService";
import { storageService } from "../services/storageService";
import { whatsappService } from "../services/whatsappService";
import { supabase } from "../config/supabase";

export const generateEstimationPdf = tool(async ({ estimation_id }) => {
  try {
    console.log(`Generating PDF for estimation: ${estimation_id}`);

    // 1. Generar el Buffer del PDF
    const pdfBuffer = await pdfService.generateEstimationPdf(estimation_id);

    // 2. Definir ruta de almacenamiento
    const timestamp = Date.now();
    const destinationPath = `estimations/${estimation_id}/${timestamp}_quote.pdf`;

    // 3. Subir a Firebase
    const publicUrl = await storageService.uploadPdfToFirebase(pdfBuffer, destinationPath);

    // 4. Actualizar registro en Supabase y obtener datos del cliente
    const { data: estimation, error } = await supabase
      .from("estimations")
      .update({
        pdf_url: publicUrl,
        pdf_updated_at: new Date().toISOString()
      })
      .eq("id", estimation_id)
      .select(`
        *,
        client:clients(name, phone)
      `)
      .single();

    if (error) {
      console.error("Error updating estimation with PDF URL:", error);
      throw new Error("Failed to update estimation record");
    }

    let whatsappStatus = "No enviado (sin teléfono)";
    
    // 5. Enviar por WhatsApp si hay teléfono
    const client = (estimation as any).client;
    if (client && client.phone) {
      try {
        await whatsappService.sendMessage(
          client.phone,
          `Hola ${client.name || 'Cliente'}, adjunto encontrarás tu cotización #${estimation.sequential_number}.`,
          publicUrl
        );
        whatsappStatus = "Enviado por WhatsApp";
      } catch (waError) {
        console.error("Error enviando WhatsApp:", waError);
        whatsappStatus = "Error enviando WhatsApp";
      }
    }

    return `PDF Generado exitosamente: ${publicUrl}. Estado WhatsApp: ${whatsappStatus}`;

  } catch (error: any) {
    console.error("Error in generate_estimation_pdf tool:", error);
    return `Error generando el PDF: ${error.message}`;
  }
}, {
  name: "generate_estimation_pdf",
  description: "Genera el PDF de la cotización, lo sube a la nube, lo envía por WhatsApp al cliente y retorna el enlace.",
  schema: z.object({
    estimation_id: z.string().uuid().describe("El ID de la estimación para la cual generar el PDF")
  })
});
