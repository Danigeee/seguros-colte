import dotenv from "dotenv";
import { graph } from "./supervisor";
import { HumanMessage } from "@langchain/core/messages";
dotenv.config();
// Función para simular los logs del sistema multiagente
const testLogs = async () => {
    console.log("🧪 INICIANDO PRUEBA DE LOGS DEL SISTEMA MULTIAGENTE\n");
    const testMessages = [
        "Hola, me interesa comprar un equipo de cómputo",
        "Tengo problemas con mi computadora, no enciende",
        "¿Cuál es su horario de atención?",
        "Necesito cotizar 5 laptops para mi empresa",
    ];
    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`\n======= PRUEBA ${i + 1} =======`);
        const config = {
            configurable: {
                thread_id: `test-${Date.now()}-${i}`,
                phone_number: "test-user",
            },
        };
        try {
            console.log("=== INICIO DE PROCESAMIENTO MULTIAGENTE ===");
            console.log("📱 Cliente:", config.configurable.phone_number);
            console.log("💬 Mensaje recibido:", message);
            console.log("🔧 Configuración:", config);
            console.log("📤 Enviando mensaje al supervisor...");
            const agentOutput = await graph.invoke({
                messages: [new HumanMessage({ content: message })],
            }, config);
            console.log("🔄 Respuesta completa del sistema multiagente:");
            console.log("📊 Número total de mensajes:", agentOutput.messages.length);
            // Log detallado de todos los mensajes del flujo
            agentOutput.messages.forEach((msg, index) => {
                console.log(`📝 Mensaje ${index + 1}:`);
                console.log(`   - Tipo: ${msg.constructor.name}`);
                console.log(`   - Agente: ${msg.name || "No especificado"}`);
                // Manejar diferentes tipos de contenido
                let contentPreview = "Sin contenido";
                if (typeof msg.content === "string") {
                    contentPreview =
                        msg.content.substring(0, 100) +
                            (msg.content.length > 100 ? "..." : "");
                }
                else if (Array.isArray(msg.content)) {
                    contentPreview = "[Contenido complejo/multimedia]";
                }
                console.log(`   - Contenido: ${contentPreview}`);
            });
            const lastMessage = agentOutput.messages[agentOutput.messages.length - 1];
            // Determinar qué agente respondió
            let respondingAgent = "Supervisor";
            if (lastMessage.name) {
                switch (lastMessage.name) {
                    case "SalesService":
                        respondingAgent = "Valentina Ríos (Ventas)";
                        break;
                    case "TechnicalService":
                        respondingAgent = "Carlos Restrepo (Soporte Técnico)";
                        break;
                    case "CustomerService":
                        respondingAgent = "María Fernanda Ortiz (Atención al Cliente)";
                        break;
                    default:
                        respondingAgent = lastMessage.name || "Supervisor";
                }
            }
            console.log("🎯 AGENTE QUE RESPONDE:", respondingAgent);
            console.log("💭 Respuesta final:", lastMessage.content);
            console.log("📋 PROCESANDO RESPUESTA PARA ENVÍO:");
            console.log("💬 Respuesta IA:", lastMessage.content);
            console.log("📏 Longitud de respuesta:", lastMessage.content.length);
            // Simular criterios de audio
            const hasNumbers = /\d/.test(lastMessage.content);
            const hasAcronyms = /\b(?:[A-Z]{2,}|\b(?:[A-Z]\.){2,}[A-Z]?)\b/.test(lastMessage.content);
            const isShortEnough = lastMessage.content.length <= 400;
            if (isShortEnough && !hasNumbers && !hasAcronyms) {
                console.log("🎵 ENVIANDO RESPUESTA COMO AUDIO");
                console.log("✅ Criterios para audio cumplidos:");
                console.log("   - Longitud ≤ 400 caracteres");
                console.log("   - No contiene números");
                console.log("   - No contiene siglas");
                console.log("   - Cliente habilitado para audio");
            }
            else {
                console.log("📝 ENVIANDO RESPUESTA COMO TEXTO");
                console.log("❌ Criterios para audio NO cumplidos:");
                console.log("   - Longitud:", lastMessage.content.length, "caracteres");
                console.log("   - Contiene números:", hasNumbers);
                console.log("   - Contiene siglas:", hasAcronyms);
            }
            console.log("=== FIN DE PROCESAMIENTO MULTIAGENTE ===");
            console.log("📱 Cliente:", config.configurable.phone_number);
            console.log("🎯 Agente final:", respondingAgent);
            console.log("🕐 Timestamp:", new Date().toISOString());
            console.log("===============================================");
            // Pausa entre pruebas
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        catch (error) {
            console.error("❌ Error en prueba:", error);
        }
    }
    console.log("\n✅ PRUEBA DE LOGS COMPLETADA");
};
// Ejecutar prueba si se ejecuta directamente
if (import.meta.url === new URL(import.meta.url).href) {
    testLogs().catch(console.error);
}
export { testLogs };
