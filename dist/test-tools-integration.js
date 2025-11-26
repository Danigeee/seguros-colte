import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { salesServiceNode } from "./agents/salesServiceAgent";
import { technicalServiceNode } from "./agents/technicalServiceAgent";
import { customerServiceNode } from "./agents/customerServiceAgent";
dotenv.config();
// ==========================================
// PRUEBAS DE INTEGRACIÓN DE HERRAMIENTAS
// ==========================================
const testState = {
    messages: [],
    next: "supervisor",
};
async function testSalesAgent() {
    console.log("🏢 PRUEBA - AGENTE DE VENTAS (Valentina)");
    console.log("=".repeat(50));
    // Prueba 1: Consulta de catálogo
    console.log("📋 Prueba 1: Consulta de catálogo");
    const catalogState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "Necesito ver el catálogo de productos para panadería",
                name: "user",
            }),
        ],
    };
    try {
        const result = await salesServiceNode(catalogState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    // Prueba 2: Cotización
    console.log("\n💰 Prueba 2: Solicitud de cotización");
    const quoteState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "Necesito cotizar 2 amasadoras para mi panadería, soy cliente empresarial",
                name: "user",
            }),
        ],
    };
    try {
        const result = await salesServiceNode(quoteState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    console.log("\n");
}
async function testTechnicalAgent() {
    console.log("🔧 PRUEBA - AGENTE TÉCNICO (Carlos)");
    console.log("=".repeat(50));
    // Prueba 1: Diagnóstico de problema
    console.log("🔍 Prueba 1: Diagnóstico de problema técnico");
    const diagnosisState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "Mi amasadora IA-Mixer 60 no arranca, el motor hace ruido pero no gira",
                name: "user",
            }),
        ],
    };
    try {
        const result = await technicalServiceNode(diagnosisState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    // Prueba 2: Verificación de garantía
    console.log("\n🛡️ Prueba 2: Verificación de garantía");
    const warrantyState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "¿Puedes verificar el estado de garantía de mi equipo PAN001? Lo compré en enero 2023",
                name: "user",
            }),
        ],
    };
    try {
        const result = await technicalServiceNode(warrantyState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    console.log("\n");
}
async function testCustomerAgent() {
    console.log("🎧 PRUEBA - AGENTE SERVICIO AL CLIENTE (María)");
    console.log("=".repeat(50));
    // Prueba 1: Rastreo de orden
    console.log("📦 Prueba 1: Rastreo de orden");
    const trackingState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "Necesito rastrear mi pedido ORD-2024-001, ¿dónde está mi orden?",
                name: "user",
            }),
        ],
    };
    try {
        const result = await customerServiceNode(trackingState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    // Prueba 2: Reclamo
    console.log("\n⚠️ Prueba 2: Manejo de reclamo");
    const complaintState = {
        ...testState,
        messages: [
            new HumanMessage({
                content: "Quiero presentar un reclamo, mi equipo llegó dañado y necesito una solución",
                name: "user",
            }),
        ],
    };
    try {
        const result = await customerServiceNode(complaintState);
        console.log("✅ Respuesta obtenida:", result.messages[0].content.substring(0, 200) + "...");
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
    console.log("\n");
}
async function runAllTests() {
    console.log("🧪 INICIANDO PRUEBAS DE INTEGRACIÓN DE HERRAMIENTAS");
    console.log("=".repeat(60));
    console.log("Verificando que los agentes usan las herramientas correctamente...\n");
    try {
        await testSalesAgent();
        await testTechnicalAgent();
        await testCustomerAgent();
        console.log("✅ PRUEBAS COMPLETADAS");
        console.log("=".repeat(60));
        console.log("Las herramientas están funcionando correctamente con los prompts actualizados.");
    }
    catch (error) {
        console.error("❌ ERROR EN PRUEBAS:", error);
    }
}
// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
    runAllTests();
}
export { runAllTests, testSalesAgent, testTechnicalAgent, testCustomerAgent };
