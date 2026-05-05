/**
 * test-andes-multi-firma.ts
 *
 * Script de prueba para validar que Andes permite firmar múltiples PDFs
 * usando el mismo OTP en llamadas secuenciales.
 *
 * Ejecutar:
 *   npx tsx src/test/test-andes-multi-firma.ts
 *
 * Variables de entorno requeridas:
 *   BACKEND_ANDES_URL, RESEND_API_KEY
 *
 * Datos de prueba configurables en la sección CONFIGURACIÓN abajo.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { PDFDocument } from 'pdf-lib';
import { Resend } from 'resend';
import { pdfBase64Store } from '../tools/generarPdfBase64Tool.js';
// ─────────────────────────────────────────────
// CONFIGURACIÓN — ajusta estos valores antes de correr
// ─────────────────────────────────────────────
const CONFIG = {
    fondo: 'casur',
    // Datos del firmante de prueba
    documento: '123456789',
    primerNombre: 'Juan',
    primerApellido: 'Prueba',
    segundoNombre: '',
    segundoApellido: '',
    correo: 'alejandro.b@ultimmarketing.com', // ← cambia al correo donde recibirás el OTP
    celular: '3001234567',
    notificacion: 1, // 1 = Email, 2 = SMS
    // Datos extra para el correo final
    nombreCompleto: 'Juan Prueba',
    telefono: '3001234567',
    // Datos adicionales para libranza
    tipoDocumento: 'CC',
    direccion: 'Calle 123 # 45-67',
    fondoPagador: 'CASUR', // entidad pagadora — va en fondo pagadora y Pensionado
    transactionId: '0000001', // 7 dígitos, mismo valor en top-right y No. Crédito
    fechaPrimeraCuota: '15/05/2026', // primer descuento según fecha de firma
    // Datos adicionales para FVC01
    fechaNacimiento: '01/01/1980', // DD/MM/AAAA
    fechaExpedicion: '15/03/2005', // DD/MM/AAAA
    departamento: 'Cundinamarca',
    municipio: 'Bogotá',
    ingresosMensuales: '3.000.000',
    numeroAfiliacion: 'AF-00123',
};
// ─────────────────────────────────────────────
const BASE_URL = process.env.BACKEND_ANDES_URL;
if (!BASE_URL) {
    console.error('❌  BACKEND_ANDES_URL no está definida en .env');
    process.exit(1);
}
function fetchConTimeout(url, options, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}
function preguntarOTP() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question('\n🔑  Ingresa el código OTP recibido en tu correo: ', answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
// ─── Campos de la SOLICITUD ────────────────────────────────────────────────
const SOLICITUD_FIELDS = {
    'text_1kzjk': CONFIG.nombreCompleto,
    'text_3rnud': CONFIG.tipoDocumento,
    'text_4kffr': CONFIG.documento,
    'text_5jqid': CONFIG.fechaNacimiento,
    'text_6mmdx': CONFIG.municipio,
    'text_7xjip': 'Masculino',
    'text_8kact': CONFIG.direccion,
    'text_9eidj': CONFIG.municipio,
    'text_10cjsk': CONFIG.departamento,
    'text_11ujbq': 'Colombia',
    'text_12mngf': CONFIG.telefono,
    'text_13myjl': CONFIG.correo,
};
// ─── Campos de la LIBRANZA ────────────────────────────────────────────────
// Posiciones confirmadas por preview visual (los campos están en orden de creación en sejda):
//   text_1bsmj → número libranza (top-right, junto al título)
//   text_2qdac → NOMBRE Y APELLIDOS
//   text_3mvjo → TIPO Y NO. IDENTIFICACION
//   text_4egyt → DIRECCION Y DOMICILIO
//   text_5aem  → TELEFONO
//   text_6lagk → No. Crédito (tabla) — mismo valor que top-right
//   text_13ftbn → Entidad pagadora (fondo de pensión)
//   text_18-20 → tres campos "Número de meses" en el cuerpo del texto
//   text_21ucj → ciudad al pie del documento
//   text_22xlgk → fecha al pie del documento
const _fechaActualLarga = new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric'
});
const LIBRANZA_TEXT_FIELDS = {
    'text_1bsmj': CONFIG.transactionId, // # Libranza (top-right)
    'text_2qdac': CONFIG.nombreCompleto, // NOMBRE Y APELLIDOS
    'text_3mvjo': `${CONFIG.tipoDocumento} ${CONFIG.documento}`, // TIPO Y NO. IDENTIFICACION
    'text_4egyt': CONFIG.direccion, // DIRECCION Y DOMICILIO
    'text_5aem': CONFIG.celular, // TELEFONO
    'text_6lagk': CONFIG.transactionId, // No. Crédito (tabla)
    'text_7tolh': '$0', // Valor Capital (fijo)
    'text_8wcas': '16.303', // Cuota mensual (fijo)
    'text_9qurk': '12 meses', // Plazo (fijo)
    'text_10dsqj': '0%', // Tasa (fija)
    'text_11wxdk': '$0', // Valor Futuro (fijo)
    'text_12bizt': CONFIG.fechaPrimeraCuota, // Fecha 1er Cuota
    'text_13ftbn': CONFIG.fondoPagador, // Entidad pagadora (fondo)
    'text_18alrv': '12 meses', // "Número de meses" cuerpo 1
    'text_19wdaq': '12 meses', // "Número de meses" cuerpo 2
    'text_20zpb': '12 meses', // "Número de meses" cuerpo 3
    'text_21ucj': 'Medellín', // Ciudad al pie
    'text_22xlgk': _fechaActualLarga, // Fecha actual al pie
};
// checkbox_14=Empleado, checkbox_15=Pensionado, checkbox_16=Contratista, checkbox_17=Afiliado
const LIBRANZA_CHECKBOXES_ON = ['checkbox_15fmgp']; // Pensionado
// ─── Campos del FVC01 (Formulario de Vinculación del Asociado) ────────────
// Mapeado desde el PDF diagnóstico (campo → posición visual confirmada)
const [fnbDay, fnbMonth, fnbYear] = CONFIG.fechaNacimiento.split('/');
const [fexDay, fexMonth, fexYear] = CONFIG.fechaExpedicion.split('/');
const [todayDay, todayMonth, todayYear] = new Date().toLocaleDateString('es-CO').split('/');
const FVC01_TEXT_FIELDS = {
    // Fecha de vinculación (esquina superior derecha)
    'text_1uzjf': todayDay,
    'text_2gdhz': todayMonth,
    'text_3gozc': todayYear,
    // Datos personales
    'text_4vvfl': CONFIG.primerNombre + (CONFIG.segundoNombre ? ' ' + CONFIG.segundoNombre : ''),
    'text_5lvlt': CONFIG.primerApellido + (CONFIG.segundoApellido ? ' ' + CONFIG.segundoApellido : ''),
    'text_53uekz': CONFIG.documento, // Número de identificación
    'text_54qgvd': 'Colombiana', // Nacionalidad
    'text_55vhtp': 'Colombia', // País Residencia
    // Fecha de nacimiento
    'text_50uowc': fnbDay,
    'text_51otwb': fnbMonth,
    'text_52wyhy': fnbYear,
    // Fecha de expedición del documento
    'text_47fwvb': fexDay,
    'text_48zetl': fexMonth,
    'text_49saey': fexYear,
    // Dirección y contacto
    'text_56hbxq': CONFIG.direccion, // Dirección domicilio
    'text_57bcgd': CONFIG.departamento, // Departamento
    'text_58zunc': CONFIG.municipio, // Municipio
    'text_59ppxu': CONFIG.correo, // Correo electrónico
    'text_43skjg': CONFIG.ingresosMensuales, // Ingresos mensuales
    // Pensionado
    'text_37fezy': CONFIG.fondoPagador, // Si es pensionado: PAGADURÍA
    'text_38hqu': CONFIG.numeroAfiliacion, // N°Afiliación
    // Fecha diligenciamiento (DD/MM/AAAA — sección inferior del formulario)
    'text_44fygh': todayDay,
    'text_45wdwj': todayMonth,
    'text_46baiq': todayYear,
};
// Checkboxes seleccionados (uno por grupo):
// - Tipo identificación:  CC         → checkbox_7
// - Nivel de educación:   Secundaria → checkbox_12  (ajustar según cliente)
// - Grupos protección:    No         → checkbox_17
// - Zona:                 Urbana     → checkbox_30
// - Ocupación:            Pensionado → checkbox_33
// - Administra recursos:  No         → checkbox_40
// - Es PEP:               No         → checkbox_42
const FVC01_CHECKBOXES_ON = [
    'checkbox_7iqif', // Tipo identificación: CC
    'checkbox_12luwn', // Nivel de educación: Secundaria
    'checkbox_17inuj', // Pertenece a grupo de protección: No
    'checkbox_30fvhh', // Zona: Urbana
    'checkbox_33bp', // Ocupación: Pensionado
    'checkbox_40klsk', // ¿Administra recursos públicos? No
    'checkbox_42hdpt', // ¿Es persona políticamente expuesta (PEP)? No
];
async function cargarPdfsEnStore() {
    const fondoDir = path.resolve(process.cwd(), 'docs', CONFIG.fondo);
    if (!fs.existsSync(fondoDir)) {
        throw new Error(`Carpeta no encontrada: ${fondoDir}`);
    }
    const pdfFiles = fs.readdirSync(fondoDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
        throw new Error(`No hay PDFs en ${fondoDir}. Ejecuta primero scripts/convert-docs-to-pdf.sh`);
    }
    console.log(`\n📂  Fondo: ${CONFIG.fondo.toUpperCase()} — ${pdfFiles.length} PDF(s) encontrado(s):`);
    pdfFiles.forEach((f, i) => console.log(`     ${i + 1}. ${f}`));
    const documentos = [];
    for (let i = 0; i < pdfFiles.length; i++) {
        const nombre = pdfFiles[i];
        const pdfPath = path.join(fondoDir, nombre);
        const pdfBytes = fs.readFileSync(pdfPath);
        let pdfFinal;
        const nombreUp = nombre.toUpperCase();
        const esSOLICITUD = nombreUp.includes('SOLICITUD');
        const esLIBRANZA = nombreUp.includes('LIBRANZA');
        const esFVC01 = nombreUp.includes('FVC01') || nombreUp.includes('FVC');
        if (esSOLICITUD || esLIBRANZA || esFVC01) {
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();
            // Determinar qué mapas aplicar
            const textFields = esSOLICITUD ? SOLICITUD_FIELDS
                : esLIBRANZA ? LIBRANZA_TEXT_FIELDS
                    : FVC01_TEXT_FIELDS;
            const checkboxesOn = esLIBRANZA ? LIBRANZA_CHECKBOXES_ON
                : esFVC01 ? FVC01_CHECKBOXES_ON
                    : [];
            for (const [fieldName, valor] of Object.entries(textFields)) {
                try {
                    form.getTextField(fieldName).setText(valor);
                }
                catch { /* campo ausente */ }
            }
            for (const fieldName of checkboxesOn) {
                try {
                    form.getCheckBox(fieldName).check();
                }
                catch { /* campo ausente */ }
            }
            pdfFinal = await pdfDoc.save({ useObjectStreams: false });
            const tipo = esSOLICITUD ? 'SOLICITUD' : esLIBRANZA ? 'LIBRANZA' : 'FVC01';
            console.log(`\n✏️   ${tipo} diligenciado: ${nombre}`);
        }
        else {
            pdfFinal = pdfBytes;
            console.log(`📎  PDF adjunto sin modificación: ${nombre}`);
        }
        const key = `pdf_${CONFIG.documento}_${i}`;
        pdfBase64Store.set(key, Buffer.from(pdfFinal).toString('base64'));
        documentos.push({ key, nombre });
    }
    return documentos;
}
async function verificarAndes() {
    console.log('\n🔗  Verificando conexión con Andes...');
    const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/test-connection`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok)
        throw new Error(`Andes no disponible: ${JSON.stringify(data)}`);
    console.log('✅  Andes disponible:', JSON.stringify(data));
}
async function solicitarOTP() {
    console.log('\n📨  Solicitando OTP a Andes...');
    const payload = {
        datosFirmante: {
            documento: CONFIG.documento,
            primerNombre: CONFIG.primerNombre,
            primerApellido: CONFIG.primerApellido,
            segundoNombre: CONFIG.segundoNombre,
            segundoApellido: CONFIG.segundoApellido,
            correo: CONFIG.correo,
            celular: CONFIG.celular,
            idTipoDocumento: 1,
            notificacion: CONFIG.notificacion,
        }
    };
    const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/solicitar-firma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok)
        throw new Error(`Error al solicitar OTP: ${JSON.stringify(data)}`);
    console.log('✅  OTP solicitado:', JSON.stringify(data));
    console.log(`\n📧  Revisa el correo: ${CONFIG.correo}`);
}
async function firmarUnDocumento(key, nombre, otp) {
    const documentoBase64 = pdfBase64Store.get(key);
    if (!documentoBase64)
        throw new Error(`PDF no encontrado en store para key: ${key}`);
    const payload = {
        documentoBase64,
        codigoOTP: otp,
        datosFirmante: {
            documento: CONFIG.documento,
            idTipoDocumento: 1,
            nombreAdjunto: path.basename(nombre, '.pdf'),
            firmaVisible: '1',
            coordenadasFirma: '80,20,150,60',
            pagina: 0,
            observaciones: 'Firma electrónica',
            tipoFirmaVis: 1,
            imagenFirma: '',
        }
    };
    console.log(`\n🖊️   Firmando: ${nombre} (key: ${key})`);
    const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/confirmar-firma-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, 30_000);
    const rawText = await res.text();
    if (!res.ok) {
        let errorData = {};
        try {
            errorData = JSON.parse(rawText);
        }
        catch { }
        throw new Error(`Error HTTP ${res.status} | estadoAndes: ${errorData?.estadoAndes} | ${rawText}`);
    }
    const data = JSON.parse(rawText);
    const idSolicitud = data?.data?.id;
    console.log(`   ✅  Firmado OK — idSolicitud: ${idSolicitud} | estado: ${data?.data?.estado}`);
    // El PDF firmado viene en data.data.mensaje
    // (andesService devuelve { estado, mensaje, id } y andesController lo envuelve en { success, data: respuesta })
    const signedPdfBase64 = data?.data?.mensaje;
    if (signedPdfBase64) {
        pdfBase64Store.set(`signed_${key}`, signedPdfBase64);
        console.log(`   💾  PDF firmado guardado en store: signed_${key}`);
    }
    else {
        console.warn(`   ⚠️   data.data.mensaje vacío — campos recibidos: ${Object.keys(data?.data ?? {}).join(', ')}`);
    }
    pdfBase64Store.delete(key);
    return idSolicitud;
}
async function descargarYEnviarCertificados(solicitudes) {
    const signedAttachments = [];
    const testigoAttachments = [];
    for (const { idSolicitud, nombreArchivo } of solicitudes) {
        // PDF firmado (con firma embebida) guardado durante firmar_documento
        const signedKey = Array.from(pdfBase64Store.keys()).find(k => k.startsWith(`signed_pdf_${CONFIG.documento}`) && pdfBase64Store.get(k));
        if (signedKey) {
            signedAttachments.push({ content: pdfBase64Store.get(signedKey), filename: nombreArchivo });
            pdfBase64Store.delete(signedKey);
            console.log(`   ✅  PDF firmado desde store: ${nombreArchivo}`);
        }
        else {
            console.warn(`   ⚠️   No hay signed_* en store para ${nombreArchivo}`);
        }
        // Certificado Andes (testigo del evento de firma)
        console.log(`   ⬇️   Descargando testigo idSolicitud: ${idSolicitud}`);
        const res = await fetchConTimeout(`${BASE_URL}/api/v1/andes/testigo/${idSolicitud}`, { method: 'GET' });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} al descargar testigo ${idSolicitud}`);
        const data = await res.json();
        if (data?.testigoBase64) {
            testigoAttachments.push({ content: data.testigoBase64, filename: `CERTIFICADO_${nombreArchivo}` });
            console.log(`   ✅  Certificado Andes descargado: ${nombreArchivo}`);
        }
        else {
            console.warn(`   ⚠️   testigoBase64 vacío para ${idSolicitud}`);
        }
    }
    const clientAttachments = signedAttachments.length > 0 ? signedAttachments : testigoAttachments;
    if (clientAttachments.length === 0) {
        throw new Error('No se pudo obtener ningún documento firmado.');
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Correo al cliente: PDFs con firma embebida
    const { error: clienteError } = await resend.emails.send({
        from: 'notificaciones@asistenciacoltefinanciera.com',
        to: CONFIG.correo,
        subject: 'Tus documentos Bienestar Plus Protegido firmados electrónicamente',
        html: `<p>Hola <strong>${CONFIG.nombreCompleto}</strong>,</p><p>Adjunto encontrarás tus documentos de solicitud <strong>Bienestar Plus Protegido</strong> con la firma electrónica aplicada.</p><p>Gracias por tu preferencia.</p><p>Coltefinanciera Seguros</p>`,
        attachments: clientAttachments,
    });
    if (clienteError)
        throw new Error(`Error Resend (cliente): ${JSON.stringify(clienteError)}`);
    console.log(`\n📧  Correo enviado a ${CONFIG.correo} con ${clientAttachments.length} adjunto(s)`);
    // Copia interna: PDFs firmados + certificados Andes
    const internalAttachments = [...signedAttachments, ...testigoAttachments];
    const { error: copyError } = await resend.emails.send({
        from: 'notificaciones@asistenciacoltefinanciera.com',
        to: 'alejandro.b@ultimmarketing.com',
        subject: `Documentos firmados OTP - ${CONFIG.nombreCompleto}`,
        html: `<p>Documentos firmados OTP del usuario <strong>${CONFIG.nombreCompleto}</strong>, cédula <strong>${CONFIG.documento}</strong>, teléfono <strong>${CONFIG.telefono}</strong>, email <strong>${CONFIG.correo}</strong>.</p>`,
        attachments: internalAttachments,
    });
    if (copyError)
        console.warn(`   ⚠️   Error copia interna: ${JSON.stringify(copyError)}`);
    else
        console.log(`📧  Copia interna enviada a alejandro.b@ultimmarketing.com con ${internalAttachments.length} adjunto(s)`);
}
async function main() {
    console.log('='.repeat(60));
    console.log('  TEST: Firma múltiple Andes con un solo OTP');
    console.log('='.repeat(60));
    try {
        // 1. Cargar PDFs en store
        const documentos = await cargarPdfsEnStore();
        // 2. Verificar Andes
        await verificarAndes();
        // 3. Solicitar OTP
        await solicitarOTP();
        // 4. Esperar OTP del usuario
        const otp = await preguntarOTP();
        if (!otp)
            throw new Error('OTP vacío');
        // 5. Firmar cada documento con el mismo OTP
        console.log(`\n🔐  Firmando ${documentos.length} documento(s) con el mismo OTP...`);
        const solicitudes = [];
        for (const { key, nombre } of documentos) {
            const idSolicitud = await firmarUnDocumento(key, nombre, otp);
            solicitudes.push({ idSolicitud, nombreArchivo: nombre });
        }
        // 6. Descargar certificados y enviar por correo
        console.log(`\n📥  Descargando certificados firmados y enviando correo a ${CONFIG.correo}...`);
        await descargarYEnviarCertificados(solicitudes);
    }
    catch (err) {
        console.error('\n❌  ERROR:', err.message);
        process.exit(1);
    }
}
main();
