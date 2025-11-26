import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm";
import { MESSAGES } from "../config/constants";
import { customerTools } from "../tools/customerTools";
dotenv.config();
const customerServiceAgent = createReactAgent({
    llm,
    tools: customerTools,
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_CUSTOMER_CARE_PROMPT),
});
export const customerServiceNode = async (state, config) => {
    const result = await customerServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new HumanMessage({
                content: lastMessage.content,
                name: "CustomerService",
            }),
        ],
        next: "supervisor",
    };
};
// customerServiceNode es un nodo que procesa mensajes para el agente de atención al cliente.
// El nodo invoca el agente de atención al cliente con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de atención al cliente como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
