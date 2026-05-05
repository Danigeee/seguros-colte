import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { googleSheetsService } from "../services/googleSheetsService.js";
import { getNextTransactionId } from "../services/transactionCounterService.js";
import { pdfBase64Store } from "./generarPdfBase64Tool.js";

// ─── Mapa LIBRANZA ─────────────────────────────────────────────────────────
// Posiciones confirmadas por preview visual (campos en orden de creación en sejda):
//   text_1bsmj  → # Libranza (top-right)
//   text_2qdac  → NOMBRE Y APELLIDOS
//   text_3mvjo  → TIPO Y NO. IDENTIFICACION
//   text_4egyt  → DIRECCION Y DOMICILIO
//   text_5aem   → TELEFONO
//   text_6lagk  → No. Crédito (tabla) — mismo valor que top-right
//   text_7tolh  → Valor Capital (fijo $0)
//   text_8wcas  → Cuota mensual (fija 16.303)
//   text_9qurk  → Plazo (fijo 12 meses)
//   text_10dsqj → Tasa (fija 0%)
//   text_11wxdk → Valor Futuro (fijo $0)
//   text_12bizt → Fecha 1er Cuota
//   text_13ftbn → Entidad pagadora (fondo)
//   text_18alrv / text_19wdaq / text_20zpb → "Número de meses" en cuerpo (fijo 12 meses)
//   text_21ucj  → Ciudad al pie
//   text_22xlgk → Fecha actual al pie
const LIBRANZA_CHECKBOXES_ON = ['checkbox_15fmgp']; // Pensionado

// ─── Mapas de checkboxes FVC01 ─────────────────────────────────────────────
const FVC01_TIPO_ID: Record<string, string> = {
  'RC':  'checkbox_6vbym',
  'CC':  'checkbox_7iqif',
  'TI':  'checkbox_8lyzg',
  'CE':  'checkbox_9sjok',
  'PAS': 'checkbox_10jted',
};

const FVC01_NIVEL_EDUCACION: Record<string, string> = {
  'Primaria':      'checkbox_11kfwv',
  'Secundaria':    'checkbox_12luwn',
  'Técnico':       'checkbox_13inih',
  'Universitario': 'checkbox_14jehr',
  'Postgrado':     'checkbox_15mbmf',
};

const FVC01_ZONA: Record<string, string> = {
  'Rural':  'checkbox_29laii',
  'Urbana': 'checkbox_30fvhh',
};

const FVC01_ADMIN_RECURSOS: Record<string, string> = {
  'Sí': 'checkbox_39rylt',
  'No': 'checkbox_40klsk',
};

const FVC01_PEP: Record<string, string> = {
  'Sí': 'checkbox_41emjq',
  'No': 'checkbox_42hdpt',
};

const FVC01_CHECKBOXES_FIJOS = [
  'checkbox_17inuj', // Pertenece a grupo protección: No
  'checkbox_33bp',   // Ocupación: Pensionado
];


interface ClienteData {
  fondoPension: string;
  nombresApellidos: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  sexo: string;
  direccionResidencia: string;
  ciudad: string;
  departamento: string;
  paisResidencia: string;
  telefono: string;
  email: string;
  fechaExpedicion: string;
  ingresosMensuales: string;
  numeroAfiliacion: string;
  nivelEducacion: string;
  zona: string;
  adminRecursosPublicos: string;
  esPEP: string;
}

function buildSolicitudFields(d: ClienteData): Record<string, string> {
  return {
    'text_1kzjk': d.nombresApellidos,
    'text_8kact': d.direccionResidencia,
    'text_3rnud': d.tipoIdentificacion,
    'text_9eidj': d.ciudad,
    'text_4kffr': d.numeroIdentificacion,
    'text_10cjsk': d.departamento,
    'text_5jqid': d.fechaNacimiento,
    'text_11ujbq': d.paisResidencia,
    'text_6mmdx': d.lugarNacimiento,
    'text_12mngf': d.telefono,
    'text_7xjip': d.sexo,
    'text_13myjl': d.email,
  };
}

function buildLibranzaFields(d: ClienteData, transactionId: string, fechaPrimeraCuota: string, fechaActualLarga: string, fondoPagador: string): Record<string, string> {
  return {
    'text_1bsmj':  transactionId,
    'text_2qdac':  d.nombresApellidos,
    'text_3mvjo':  `${d.tipoIdentificacion} ${d.numeroIdentificacion}`,
    'text_4egyt':  d.direccionResidencia,
    'text_5aem':   d.telefono,
    'text_6lagk':  transactionId,
    'text_7tolh':  '$0',
    'text_8wcas':  '16.303',
    'text_9qurk':  '12 meses',
    'text_10dsqj': '0%',
    'text_11wxdk': '$0',
    'text_12bizt': fechaPrimeraCuota,
    'text_13ftbn': fondoPagador,
    'text_18alrv': '12 meses',
    'text_19wdaq': '12 meses',
    'text_20zpb':  '12 meses',
    'text_21ucj':  'Medellín',
    'text_22xlgk': fechaActualLarga,
  };
}

function buildAutorizacionFields(d: ClienteData, transactionId: string): Record<string, string> {
  const now = new Date();
  const todayDay       = String(now.getDate()).padStart(2, '0');
  const todayYear      = String(now.getFullYear());
  const todayMonthName = now.toLocaleDateString('es-CO', { month: 'long' });
  const nextMonthDate  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName  = nextMonthDate.toLocaleDateString('es-CO', { month: 'long' });
  const nextMonthYear  = String(nextMonthDate.getFullYear());
  return {
    'text_1luco': d.nombresApellidos,       // "Yo ___"
    'text_2tudq': d.numeroIdentificacion,   // cédula número
    'text_4oiwk': '$16.303',                // "valor de ___" (cuota mensual)
    'text_5mpts': transactionId,            // "a través de la libranza número ___"
    'text_6jgbh': todayDay,                 // "suscrita por mí el día ___"
    'text_7tgav': todayMonthName,           // "del mes de ___" (firma)
    'text_8amru': todayYear,                // "del año ___" (firma)
    'text_9rqma': 'COOPERATIVA ACTIVA',    // "a favor de ___"
    'text_10jhfr': nextMonthName,           // "nómina del mes de ___"
    'text_11dgnu': nextMonthYear,           // "del año ___" (nómina)
    'text_12gbpz': todayDay,                // constancia "_____ días"
    'text_13oobu': todayMonthName,          // constancia "del mes de ___"
    'text_14hgrq': todayYear,               // constancia "del año ___"
  };
}

function buildFVC01Fields(d: ClienteData, fondoPagador: string): Record<string, string> {
  const [fnbDay, fnbMonth, fnbYear] = d.fechaNacimiento.split('/');
  const [fexDay, fexMonth, fexYear] = d.fechaExpedicion.split('/');
  const now = new Date();
  const [todayDay, todayMonth, todayYear] = now.toLocaleDateString('es-CO').split('/');
  return {
    'text_1uzjf': todayDay,   'text_2gdhz': todayMonth,  'text_3gozc': todayYear,
    'text_4vvfl': d.primerNombre + (d.segundoNombre ? ' ' + d.segundoNombre : ''),
    'text_5lvlt': d.primerApellido + (d.segundoApellido ? ' ' + d.segundoApellido : ''),
    'text_53uekz': d.numeroIdentificacion,
    'text_54qgvd': 'Colombiana',
    'text_55vhtp': 'Colombia',
    'text_50uowc': fnbDay,    'text_51otwb': fnbMonth,   'text_52wyhy': fnbYear,
    'text_47fwvb': fexDay,    'text_48zetl': fexMonth,   'text_49saey': fexYear,
    'text_56hbxq': d.direccionResidencia,
    'text_57bcgd': d.departamento,
    'text_58zunc': d.ciudad,
    'text_59ppxu': d.email,
    'text_43skjg': d.ingresosMensuales,
    'text_37fezy': fondoPagador,
    'text_38hqu':  d.numeroAfiliacion,
    'text_44fygh': todayDay,  'text_45wdwj': todayMonth, 'text_46baiq': todayYear,
  };
}

/**
 * Genera todos los PDFs del fondo de pensión del cliente, los almacena en el store
 * servidor-side y retorna la lista de claves para que el agente pueda firmarlos
 * individualmente con Andes usando el mismo OTP.
 *
 * Documentos soportados por tipo:
 *   - SOLICITUD  → rellena los 12 campos estándar
 *   - LIBRANZA   → rellena 19 campos (financieros hardcoded) + checkbox Pensionado
 *   - FVC01      → rellena 21 campos (datos personales + económicos) + 7 checkboxes
 *   - Otros      → se adjuntan sin modificación
 */
export const generarPdfsFondoTool = new DynamicStructuredTool({
  name: "generarPdfsFondoTool",
  description: `Genera TODOS los documentos PDF del fondo de pensión del cliente (Casur, Cremil o Fiduprevisora) y los prepara para firma electrónica con Andes.
  Úsalo EXCLUSIVAMENTE en el flujo de descuento por pensión, DESPUÉS de recopilar los 15 datos del cliente y conocer su fondo.
  Casur y Cremil generan 3 documentos (SOLICITUD, LIBRANZA, FVC01). Fiduprevisora genera 4 documentos (SOLICITUD, FORMATO AUTORIZACIÓN DESCUENTO LIBRANZAS, LIBRANZA, FVC01).
  El transactionId se genera automáticamente de forma secuencial.
  Retorna la lista de documentos generados con sus claves (key) y nombres de archivo.
  CRÍTICO: Guarda TODOS los elementos de esa lista — necesitarás la 'key' de CADA UNO para llamar a firmar_documento por separado. No omitas ninguno.`,
  schema: z.object({
    fondoPension: z
      .enum(['casur', 'cremil', 'fiduprevisora'])
      .describe("Fondo de pensión del cliente: 'casur', 'cremil' o 'fiduprevisora'"),
    nombresApellidos: z.string().describe("Nombres y apellidos completos del titular"),
    primerNombre:     z.string().describe("Primer nombre del titular"),
    segundoNombre:    z.string().nullable().default('').describe("Segundo nombre del titular (puede estar vacío)"),
    primerApellido:   z.string().describe("Primer apellido del titular"),
    segundoApellido:  z.string().nullable().default('').describe("Segundo apellido del titular (puede estar vacío)"),
    tipoIdentificacion: z.string().describe("Tipo de identificación (CC, CE, etc.)"),
    numeroIdentificacion: z.string().describe("Número del documento de identidad"),
    fechaNacimiento:  z.string().describe("Fecha de nacimiento del titular (DD/MM/AAAA)"),
    lugarNacimiento:  z.string().describe("Lugar de nacimiento"),
    sexo:             z.string().describe("Sexo del titular (Masculino, Femenino)"),
    direccionResidencia: z.string().describe("Dirección de residencia completa"),
    ciudad:           z.string().describe("Ciudad de residencia"),
    departamento:     z.string().describe("Departamento de residencia"),
    paisResidencia:   z.string().describe("País de residencia"),
    telefono:         z.string().describe("Número de teléfono o celular"),
    email:            z.string().describe("Correo electrónico del titular"),
    fechaExpedicion:  z.string().describe("Fecha de expedición del documento de identidad (DD/MM/AAAA)"),
    ingresosMensuales: z.string().describe("Ingresos mensuales del pensionado (ej: '3.000.000')"),
    numeroAfiliacion:  z.string().describe("Número de afiliación al fondo de pensión"),
    nivelEducacion:    z.string().describe("Nivel de educación del titular (Primaria / Secundaria / Técnico / Universitario / Postgrado)"),
    zona:              z.string().describe("Zona de residencia: 'Urbana' o 'Rural'"),
    adminRecursosPublicos: z.string().describe("¿Administra recursos públicos? 'Sí' o 'No'"),
    esPEP:             z.string().describe("¿Es persona políticamente expuesta (PEP)? 'Sí' o 'No'"),
  }),
  func: async (data) => {
    try {
      const {
        fondoPension,
        nombresApellidos, primerNombre, segundoNombre, primerApellido, segundoApellido,
        tipoIdentificacion, numeroIdentificacion,
        fechaNacimiento, lugarNacimiento, sexo,
        direccionResidencia, ciudad, departamento, paisResidencia,
        telefono, email,
        fechaExpedicion, ingresosMensuales, numeroAfiliacion,
        nivelEducacion, zona, adminRecursosPublicos, esPEP,
      } = data;

      // Normalizar campos que pueden venir con variaciones del LLM
      const normSiNo = (v: string) => v.trim().toLowerCase() === 'si' || v.trim() === 'Sí' ? 'Sí' : 'No';
      const adminRecursosPublicosNorm = normSiNo(adminRecursosPublicos);
      const esPEPNorm = normSiNo(esPEP);
      // Normalizar nivel de educación (case-insensitive)
      const nivelMap: Record<string, string> = {
        'primaria': 'Primaria', 'secundaria': 'Secundaria', 'tecnico': 'Técnico',
        'técnico': 'Técnico', 'universitario': 'Universitario', 'postgrado': 'Postgrado',
      };
      const nivelEducacionNorm = nivelMap[nivelEducacion.trim().toLowerCase()] ?? nivelEducacion;
      // Normalizar zona
      const zonaUp = zona.trim().toLowerCase();
      const zonaNorm = zonaUp === 'urbana' ? 'Urbana' : zonaUp === 'rural' ? 'Rural' : zona;

      // ── Idempotencia: si los PDFs ya están en el store, no regenerar ──────────
      // Evita duplicar registros en Google Sheets cuando el agente llama al tool
      // por segunda vez (ej: tras un fallo de Andes sin OTP).
      const firstKey = `pdf_${numeroIdentificacion}_0`;
      if (pdfBase64Store.has(firstKey)) {
        const fondoDir0 = path.resolve(process.cwd(), "docs", fondoPension);
        const pdfFiles0 = fs.existsSync(fondoDir0)
          ? fs.readdirSync(fondoDir0).filter(f => {
              const l = f.toLowerCase();
              return l.endsWith('.pdf') && !l.includes('__diagnostico') && !l.includes('__preview');
            })
          : [];
        const existingDocs = pdfFiles0
          .map((nombre, i) => ({ key: `pdf_${numeroIdentificacion}_${i}`, nombre }))
          .filter(({ key }) => pdfBase64Store.has(key));

        console.log(`[generarPdfsFondoTool] PDFs ya en store para ${numeroIdentificacion} — omitiendo regeneración.`);
        return JSON.stringify({
          success: true,
          fondo: fondoPension,
          documentos: existingDocs,
          mensaje: `Los ${existingDocs.length} documento(s) del fondo ${fondoPension.toUpperCase()} ya estaban generados. Procede directamente con la firma Andes: verificar_estado_andes → solicitar_certificado → firmar_documento por cada elemento.`,
        });
      }
      // ─────────────────────────────────────────────────────────────────────────

      console.log(`[generarPdfsFondoTool] Iniciando para fondo '${fondoPension}', doc: ${numeroIdentificacion}`);

      const fondoDir = path.resolve(process.cwd(), "docs", fondoPension);
      if (!fs.existsSync(fondoDir)) {
        return JSON.stringify({ success: false, error: `Carpeta del fondo no encontrada: ${fondoDir}` });
      }

      const pdfFiles = fs.readdirSync(fondoDir).filter(f => {
        const lower = f.toLowerCase();
        return lower.endsWith('.pdf') && !lower.includes('__diagnostico') && !lower.includes('__preview');
      });
      if (pdfFiles.length === 0) {
        return JSON.stringify({ success: false, error: `No hay archivos PDF en '${fondoPension}'.` });
      }

      // Calcular valores automáticos
      const transactionId = await getNextTransactionId();
      const now = new Date();
      const fechaPrimeraCuotaDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      const fechaPrimeraCuota = fechaPrimeraCuotaDate.toLocaleDateString('es-CO');
      const fechaActualLarga = now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      const fondoPagador = fondoPension.toUpperCase();

      console.log(`[generarPdfsFondoTool] transactionId: ${transactionId} | fechaPrimeraCuota: ${fechaPrimeraCuota}`);

      const clienteData: ClienteData = {
        fondoPension, nombresApellidos,
        primerNombre, segundoNombre: segundoNombre ?? '', primerApellido, segundoApellido: segundoApellido ?? '',
        tipoIdentificacion, numeroIdentificacion,
        fechaNacimiento, lugarNacimiento, sexo,
        direccionResidencia, ciudad, departamento, paisResidencia,
        telefono, email, fechaExpedicion, ingresosMensuales, numeroAfiliacion,
        nivelEducacion: nivelEducacionNorm, zona: zonaNorm,
        adminRecursosPublicos: adminRecursosPublicosNorm, esPEP: esPEPNorm,
      };


      const documentosGenerados: Array<{ key: string; nombre: string }> = [];

      for (let i = 0; i < pdfFiles.length; i++) {
        const nombreArchivo = pdfFiles[i];
        const pdfPath = path.join(fondoDir, nombreArchivo);
        const pdfBytes = fs.readFileSync(pdfPath);
        let pdfFinal: Uint8Array;

        const nombreUp = nombreArchivo.toUpperCase();
        const esSOLICITUD    = nombreUp.includes('SOLICITUD');
        const esAUTORIZACION = nombreUp.includes('AUTORIZACION');
        const esLIBRANZA     = nombreUp.includes('LIBRANZA') && !esAUTORIZACION;
        const esFVC01        = nombreUp.includes('FVC01') || nombreUp.includes('FVC');

        if (esSOLICITUD || esLIBRANZA) {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const form   = pdfDoc.getForm();

          const textFields = esSOLICITUD
            ? buildSolicitudFields(clienteData)
            : buildLibranzaFields(clienteData, transactionId, fechaPrimeraCuota, fechaActualLarga, fondoPagador);

          const checkboxesOn: string[] = esLIBRANZA ? LIBRANZA_CHECKBOXES_ON : [];

          for (const [fieldName, valor] of Object.entries(textFields)) {
            try { form.getTextField(fieldName).setText(valor); } catch {
              console.warn(`[generarPdfsFondoTool] Campo '${fieldName}' no encontrado en ${nombreArchivo}`);
            }
          }
          for (const fieldName of checkboxesOn) {
            try { form.getCheckBox(fieldName).check(); } catch {
              console.warn(`[generarPdfsFondoTool] Checkbox '${fieldName}' no encontrado en ${nombreArchivo}`);
            }
          }

          pdfFinal = await pdfDoc.save({ useObjectStreams: false });
          const tipo = esSOLICITUD ? 'SOLICITUD' : 'LIBRANZA';
          console.log(`[generarPdfsFondoTool] ${tipo} diligenciado: ${nombreArchivo}`);
        } else if (esFVC01) {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const form   = pdfDoc.getForm();
          const fvc01Text = buildFVC01Fields(clienteData, fondoPagador);
          const fvc01Checks: string[] = [
            ...FVC01_CHECKBOXES_FIJOS,
            ...(FVC01_TIPO_ID[clienteData.tipoIdentificacion]            ? [FVC01_TIPO_ID[clienteData.tipoIdentificacion]]            : []),
            ...(FVC01_NIVEL_EDUCACION[clienteData.nivelEducacion]        ? [FVC01_NIVEL_EDUCACION[clienteData.nivelEducacion]]        : []),
            ...(FVC01_ZONA[clienteData.zona]                             ? [FVC01_ZONA[clienteData.zona]]                             : []),
            ...(FVC01_ADMIN_RECURSOS[clienteData.adminRecursosPublicos]  ? [FVC01_ADMIN_RECURSOS[clienteData.adminRecursosPublicos]]  : []),
            ...(FVC01_PEP[clienteData.esPEP]                             ? [FVC01_PEP[clienteData.esPEP]]                             : []),
          ];
          for (const [f, v] of Object.entries(fvc01Text)) {
            try { form.getTextField(f).setText(v); } catch { /* campo ausente */ }
          }
          for (const f of fvc01Checks) {
            try { form.getCheckBox(f).check(); } catch { /* campo ausente */ }
          }
          pdfFinal = await pdfDoc.save({ useObjectStreams: false });
          console.log(`[generarPdfsFondoTool] FVC01 diligenciado: ${nombreArchivo}`);
        } else if (esAUTORIZACION) {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const form   = pdfDoc.getForm();
          const autFields = buildAutorizacionFields(clienteData, transactionId);
          for (const [f, v] of Object.entries(autFields)) {
            try { form.getTextField(f).setText(v); } catch { /* campo ausente */ }
          }
          pdfFinal = await pdfDoc.save({ useObjectStreams: false });
          console.log(`[generarPdfsFondoTool] AUTORIZACION diligenciada: ${nombreArchivo}`);
        } else {
          pdfFinal = pdfBytes;
          console.log(`[generarPdfsFondoTool] PDF adjunto sin modificación: ${nombreArchivo}`);
        }

        const pdfKey = `pdf_${numeroIdentificacion}_${i}`;
        pdfBase64Store.set(pdfKey, Buffer.from(pdfFinal).toString('base64'));
        documentosGenerados.push({ key: pdfKey, nombre: nombreArchivo });
      }

      // Registrar en Google Sheets
      try {
        await googleSheetsService.appendMeFiaData({
          nombresApellidos, tipoIdentificacion, numeroIdentificacion,
          fechaNacimiento, lugarNacimiento, sexo,
          direccionResidencia, ciudad, departamento, paisResidencia,
          telefono, email,
        });
        console.log(`[generarPdfsFondoTool] Datos registrados en Google Sheets para ${numeroIdentificacion}`);
      } catch (sheetsError: any) {
        console.error("[generarPdfsFondoTool] Error al registrar en Google Sheets:", sheetsError.message);
      }

      console.log(`[generarPdfsFondoTool] ${documentosGenerados.length} PDFs listos para fondo '${fondoPension}'.`);

      return JSON.stringify({
        success: true,
        fondo: fondoPension,
        transactionId,
        documentos: documentosGenerados,
        mensaje: `Se generaron ${documentosGenerados.length} documento(s) para el fondo ${fondoPagador} (transacción ${transactionId}). Procede con la firma Andes: primero verificar_estado_andes, luego solicitar_certificado, espera el OTP del cliente y llama a firmar_documento para cada documento de la lista usando su 'key'.`,
      });
    } catch (error: any) {
      console.error("[generarPdfsFondoTool] Error:", error);
      return JSON.stringify({ success: false, error: error.message });
    }
  },
});
