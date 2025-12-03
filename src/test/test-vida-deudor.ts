import { HumanMessage } from "@langchain/core/messages";
import { vidaDeudorAdvisorNode } from "../agents/vidaDeudorAgent.js";
import { AgentState } from "../agents/agentState.js";
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    console.log('🧪 INICIANDO PRUEBA DE AGENTE VIDA DEUDOR\n');

    // Consulta específica para Vida Deudor
    const userQuery = "¿Qué cubre la asistencia vida deudor?";
    console.log(`👤 Usuario: "${userQuery}"\n`);

    // Estado inicial simulado
    const initialState = {
        messages: [new HumanMessage(userQuery)],
        activeProjectId: "test-project",
        activeEstimationId: "test-estimation",
        activeClientId: "test-client",
        // Simulamos un cliente identificado con servicio vidadeudor para probar la lógica específica
        clientData: {
            name: "Juan Pérez",
            email: "juan@example.com",
            document_id: "12345678",
            phone_number: "+573001234567",
            service: "vidadeudor", 
            product: "Crédito Libre Inversión"
        },
        next: "FINISH"
    };

    try {
        console.log('🤖 Consultando al agente Vida Deudor...\n');
        // Llamamos directamente al nodo del agente Vida Deudor para garantizar que sea él quien responda
        const result = await vidaDeudorAdvisorNode(initialState);
        
        const lastMessage = result.messages[result.messages.length - 1];
        console.log('💬 Respuesta de la IA:\n');
        console.log(lastMessage.content);

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

runTest();
