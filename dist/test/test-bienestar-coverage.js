import { HumanMessage } from "@langchain/core/messages";
import { bienestarPlusAdvisorNode } from "../agents/bienestarPlusAdvisor.js";
import dotenv from 'dotenv';
dotenv.config();
async function runTest() {
    console.log('🧪 INICIANDO PRUEBA DE COBERTURA BIENESTAR PLUS\n');
    const userQuery = "Como es el proceso de atención para acompañamiento de enfermería";
    console.log(`👤 Usuario: "${userQuery}"\n`);
    const initialState = {
        messages: [new HumanMessage(userQuery)],
        activeProjectId: "test-project",
        activeEstimationId: "test-estimation",
        activeClientId: "test-client",
        clientData: null,
        next: "FINISH"
    };
    try {
        console.log('🤖 Consultando al agente...\n');
        const result = await bienestarPlusAdvisorNode(initialState);
        const lastMessage = result.messages[result.messages.length - 1];
        console.log('💬 Respuesta de la IA:\n');
        console.log(lastMessage.content);
    }
    catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}
runTest();
