import dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/llm";
import { MESSAGES } from "../config/constants";
import { technicalTools } from "../tools/technicalTools";
dotenv.config();
const technicalServiceAgent = createReactAgent({
    llm,
    tools: technicalTools,
    stateModifier: new SystemMessage(MESSAGES.SYSTEM_TECHNICAL_PROMPT),
});
export const technicalServiceNode = async (state, config) => {
    const result = await technicalServiceAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new HumanMessage({
                content: lastMessage.content,
                name: "TechnicalService",
            }),
        ],
        next: "supervisor",
    };
};
// technicalServiceNode es un nodo que procesa mensajes para el agente de servicio técnico.
// El nodo invoca el agente de servicio técnico con el estado actual y la configuración proporcionada.
// Luego, devuelve la respuesta del agente de servicio técnico como un mensaje humano.
// El mensaje humano contiene el contenido de la respuesta y el nombre del agente que envió el mensaje.
