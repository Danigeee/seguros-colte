import express from "express";
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import mefiaRoutes from './routes/mefiaRoutes.js';
import cors from "cors";
import { pdfBase64Store } from './tools/generarPdfBase64Tool.js';
import { cleanupInactiveThreads, setupCheckpointer } from './supervisor.js';
const app = express();
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 3033;
const allowedOrigins = ['http://localhost:5173', 'https://ultim-admin-dashboard.web.app', 'https://ultim-admin-dashboard.firebaseapp.com', 'https://dashboard.ultim.pro', 'https://ultim.pro', 'https://trasnferchat-1336.twil.io/transferChat', 'https://trasnferchat-1336.twil.io', 'https://ultim.pro/dashboard/carestream/chat-carestream', 'https://elevenlabs.io'];
app.use(cors({
    origin: '*', // Cambia temporalmente a '*' para descartar CORS como problema
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`   Headers: ${JSON.stringify(req.headers)}`);
    next();
});
app.options('*', cors());
// Global Error Handlers to prevent server crash
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    // Optional: process.exit(1) if you want to force restart, but for debugging we keep it alive or let PM2 handle it
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
});
app.use('/', paymentRoutes); // Rutas de pagos -> Crear Persona y Link de Pago
app.use('/', chatRoutes);
app.use('/', mefiaRoutes);
// Capturar errores no manejados para evitar reinicios
process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION - EVITANDO CRASH:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack?.substring(0, 500));
    // No hacer exit, intentar continuar
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION - EVITANDO CRASH:');
    console.error('   Promise:', promise);
    console.error('   Reason:', reason);
    // No hacer exit, intentar continuar
});
// Limpieza periódica de PDFs en memoria (cada 5 minutos)
setInterval(() => {
    const removed = pdfBase64Store.cleanup(15);
    if (removed > 0)
        console.log(`🧹 PDFs expirados eliminados: ${removed} (quedan ${pdfBase64Store.size})`);
}, 5 * 60_000);
// Limpieza periódica de threads inactivos del grafo (cada 10 minutos)
setInterval(() => {
    const removed = cleanupInactiveThreads(30);
    if (removed > 0)
        console.log(`🧹 Threads inactivos eliminados: ${removed}`);
}, 10 * 60_000);
// Monitoreo de memoria (cada 15 segundos)
setInterval(() => {
    const heap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const rss = Math.round(process.memoryUsage().rss / 1024 / 1024);
    if (heap > 500) {
        console.warn(`⚠️ Memoria: heap=${heap}MB rss=${rss}MB pdfs=${pdfBase64Store.size}`);
    }
    if (heap > 900) {
        console.error(`🚨 Memoria crítica ${heap}MB — limpieza de emergencia`);
        pdfBase64Store.cleanup(3);
        cleanupInactiveThreads(10);
        if (global.gc) {
            global.gc();
            console.log('🧹 GC forzado ejecutado');
        }
    }
}, 15_000);
setupCheckpointer()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`🔧 Protección contra crashes activada`);
        console.log(`💾 Monitoreo de memoria activado`);
    });
})
    .catch((err) => {
    console.error("❌ No se pudo inicializar el checkpointer PostgreSQL:", err.message);
    process.exit(1);
});
