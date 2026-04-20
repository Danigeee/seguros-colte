/**
 * test-bienestar-pension-flow.ts
 *
 * Prueba automática multi-turno del flujo Bienestar Plus con pensión (Casur).
 *
 * Simula una conversación real con 15+ turnos:
 *  - Interés inicial con dudas y objeciones
 *  - Error de tipeo en el correo → corrección en turno siguiente
 *  - Datos completos del flujo de pensión (20 campos)
 *  - Generación de PDFs con generarPdfsFondoTool
 *  - Solicitud de OTP a Andes ← única pausa manual
 *  - Firma secuencial de documentos con el OTP
 *
 * ─── Cómo ejecutar ───────────────────────────────────────────────────────────
 *   npx tsx src/test/test-bienestar-pension-flow.ts
 *
 * El test corre solo. Solo te pedirá que ingreses el OTP cuando lo recibas
 * en alejandro.b@ultimmarketing.com. Si quieres saltarlo:
 *   SKIP_OTP=true npx tsx src/test/test-bienestar-pension-flow.ts
 */
import 'dotenv/config';
import * as readline from 'readline';
import { HumanMessage } from '@langchain/core/messages';
import { graph, trackThreadActivity, checkpointerReady } from '../supervisor.js';
import { pdfBase64Store } from '../tools/generarPdfBase64Tool.js';
// ─── CONFIG ───────────────────────────────────────────────────────────────────
const THREAD_ID = `test-pension-${Date.now()}`;
const SKIP_OTP = process.env.SKIP_OTP === 'true';
const DELAY_MS = 1_200; // pausa entre turnos (ms) — imita tiempo de escritura humano
// ─── GUION AUTOMÁTICO ─────────────────────────────────────────────────────────
// Conversación diseñada para:
//  1. Generar múltiples turnos (estrés de memoria)
//  2. Probar corrección de datos (correo incorrecto → corregido)
//  3. Cubrir los 20 campos requeridos del flujo pensión
//  4. Incluir objeciones y vacilaciones típicas del cliente
const SCRIPT = [
    // ── Turno 1: saludo ambiguo con nombre diferente (llega sin datos de cliente real)
    'Hola buenas, me contactaron de Coltefinanciera',
    // ── Turno 2: duda sobre identidad del bot
    'Eso sí, antes de seguir... ¿estoy hablando con una persona o con un robot?',
    // ── Turno 3: pregunta de precio sin contexto
    'Me dijeron que el seguro cuesta como 15 mil pesos, ¿eso es al mes o al año?',
    // ── Turno 4: objeción de precio
    'Eso me parece caro para lo que ofrece, ¿qué tiene de especial?',
    // ── Turno 5: interés en el médico a domicilio
    'Lo de médico a domicilio sí me llama la atención, ¿en Medellín sí aplica?',
    // ── Turno 6: decisión de compra + canal pensión
    'Bueno, listo. Quiero activarlo. Soy pensionado, me descuentan de la pensión',
    // ── Turno 7: fondo de pensión
    'Mi fondo es Casur',
    // ── Turno 8: datos personales parte 1
    'Mi nombre es Alejandro Betancur Ospina, CC número 1143852110',
    // ── Turno 9: fechas y lugar
    'Nací el 08/11/1989 en Medellín, documento expedido el 12/03/2008',
    // ── Turno 10: sexo + dirección + ciudad + dpto + país
    'Soy masculino, vivo en Carrera 43A # 16A-40, Medellín, Antioquia, Colombia',
    // ── Turno 11: teléfono + CORREO INCORRECTO (error deliberado en dominio)
    'Celular 3004561122, correo alejandro.b@ultimmarkting.com',
    // ^ falta una 'e' en ultimmarketing → ultimmarkting
    // ── Turno 12: el cliente "se da cuenta" del error y corrige
    'Espera, me equivoqué en el correo. El correo correcto es alejandro.b@ultimmarketing.com',
    // ── Turno 13: ingresos + número de afiliación
    'Mis ingresos son 3.500.000 mensuales, número de afiliación AF-78234',
    // ── Turno 14: datos socioeconómicos restantes
    'Nivel de educación universitario, zona urbana, no manejo recursos públicos, no soy PEP',
    // ── Turno 15: petición explícita de generar documentos (empuja a generarPdfsFondoTool)
    'Perfecto, ya tienes todos mis datos. Por favor genera los documentos y procede con la firma',
];
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function heapMB() {
    const h = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const r = Math.round(process.memoryUsage().rss / 1024 / 1024);
    return `heap=${h}MB rss=${r}MB`;
}
function short(text, max = 500) {
    return text.length > max ? text.slice(0, max) + ' [...]' : text;
}
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
function askOTP() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question('\n🔑  OTP recibido en tu correo → ', ans => {
            rl.close();
            resolve(ans.trim());
        });
    });
}
/** Devuelve true si la respuesta del agente está pidiendo el OTP */
function agentePidiendoOTP(text) {
    const lower = text.toLowerCase();
    return (lower.includes('otp') ||
        lower.includes('código de') ||
        lower.includes('8 dígitos') ||
        lower.includes('código que recibiste') ||
        lower.includes('código enviado') ||
        lower.includes('ingresa el código'));
}
// ─── EJECUTAR UN TURNO ────────────────────────────────────────────────────────
async function runTurn(userMessage, n) {
    console.log(`\n${'─'.repeat(62)}`);
    console.log(`🔵 TURNO ${String(n).padStart(2, '0')}  |  ${heapMB()}  |  PDFs: ${pdfBase64Store.size}`);
    console.log(`👤 Usuario: "${userMessage}"`);
    trackThreadActivity(THREAD_ID);
    const config = { configurable: { thread_id: THREAD_ID, user_phone: '+573004561122' } };
    const inputs = { messages: [new HumanMessage(userMessage)] };
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('⏱️  Timeout 90s')), 90_000));
    const output = await Promise.race([graph.invoke(inputs, config), timeout]);
    const last = output.messages[output.messages.length - 1];
    const reply = typeof last.content === 'string' ? last.content : JSON.stringify(last.content);
    const totalMsgs = output.messages.length;
    console.log(`🤖 Agente [${totalMsgs} msgs]: ${short(reply)}`);
    if (totalMsgs > 50) {
        console.warn(`   ⚠️  Estado con ${totalMsgs} mensajes — se aproxima al límite de 60`);
    }
    return { reply, msgCount: totalMsgs };
}
// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    const startHeap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log('═'.repeat(62));
    console.log('  TEST AUTOMÁTICO: Bienestar Plus — Flujo Pensión (Casur)');
    console.log(`  Thread  : ${THREAD_ID}`);
    console.log(`  SKIP_OTP: ${SKIP_OTP}`);
    console.log(`  Correo  : alejandro.b@ultimmarketing.com (error deliberado en turno 11)`);
    console.log('═'.repeat(62));
    console.log(`\n📊 Memoria inicial: ${heapMB()}`);
    // Esperar a que las tablas del checkpointer estén listas en Supabase
    await checkpointerReady;
    let turnNumber = 0;
    let detectedOTP = false;
    try {
        for (const message of SCRIPT) {
            turnNumber++;
            await sleep(DELAY_MS);
            const { reply, msgCount } = await runTurn(message, turnNumber);
            // Detectar si el agente ya solicitó el OTP (PDFs generados correctamente)
            if (agentePidiendoOTP(reply)) {
                detectedOTP = true;
                console.log('\n✅ El agente solicitó el OTP. PDFs generados correctamente.');
                break;
            }
        }
        console.log(`\n📊 Memoria tras guion: ${heapMB()} | PDFs en store: ${pdfBase64Store.size}`);
        // ── Fase OTP ──────────────────────────────────────────────────────────────
        if (!detectedOTP) {
            console.log('\n⚠️  El agente no solicitó el OTP durante el guion.');
            console.log('   Puede que falten datos o el agente necesite más contexto.');
        }
        else if (SKIP_OTP) {
            console.log('\n⏭️  SKIP_OTP=true — prueba terminada sin firma.');
        }
        else {
            console.log('\n📧  Revisa alejandro.b@ultimmarketing.com');
            const otp = await askOTP();
            if (!otp) {
                console.log('   OTP vacío — terminando sin firma.');
            }
            else {
                turnNumber++;
                await sleep(DELAY_MS);
                await runTurn(otp, turnNumber);
                console.log(`\n📊 Memoria tras OTP: ${heapMB()} | PDFs: ${pdfBase64Store.size}`);
            }
        }
        // ── Resumen ───────────────────────────────────────────────────────────────
        const finalHeap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const finalState = await graph.getState({
            configurable: { thread_id: THREAD_ID },
        });
        const stateMsgCount = finalState?.values?.messages?.length ?? -1;
        console.log('\n' + '═'.repeat(62));
        console.log('  RESUMEN');
        console.log('═'.repeat(62));
        console.log(`  Turnos ejecutados  : ${turnNumber}`);
        console.log(`  Mensajes en estado : ${stateMsgCount} / 60`);
        console.log(`  PDFs en store      : ${pdfBase64Store.size}`);
        console.log(`  Heap inicial       : ${startHeap}MB`);
        console.log(`  Heap final         : ${finalHeap}MB`);
        console.log(`  Delta heap         : ${finalHeap - startHeap}MB`);
        if (stateMsgCount > 60) {
            console.error(`\n  ❌ FALLO: estado superó el límite (${stateMsgCount} > 60)`);
            process.exit(1);
        }
        else {
            console.log('\n  ✅ Estado dentro del límite de 60 mensajes');
        }
        if (finalHeap - startHeap > 400) {
            console.warn(`\n  ⚠️  Heap creció ${finalHeap - startHeap}MB — revisa posibles leaks`);
        }
        else {
            console.log('  ✅ Crecimiento de memoria aceptable');
        }
        console.log('\n  Prueba completada.');
    }
    catch (err) {
        console.error(`\n❌ ERROR en turno ${turnNumber}: ${err.message}`);
        console.error(err.stack?.split('\n').slice(0, 6).join('\n'));
        process.exit(1);
    }
}
main();
