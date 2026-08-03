import express from "express";
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import cors from "cors";
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
app.use('/', advisorRoutes); // Rutas del asesor humano -> Buscar cliente y crear link
app.use('/', chatRoutes);
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
// Monitorear uso de memoria
setInterval(() => {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.rss / 1024 / 1024);
    if (memMB > 400) {
        console.warn(`⚠️ Memoria alta: ${memMB}MB`);
        if (global.gc) {
            global.gc();
            console.log('🧹 Garbage collection ejecutado automáticamente');
        }
    }
}, 30000); // Cada 30 segundos
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`🔧 Protección contra crashes activada`);
    console.log(`💾 Monitoreo de memoria activado`);
});
