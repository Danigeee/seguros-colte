import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { ClientData } from "../functions/clientFunctions.js";

const MSG_HARD_CAP = 80;

/**
 * Cuando el historial supera MSG_HARD_CAP, descartamos primero los pares
 * tool_use / tool_result más antiguos (mensajes de plomería interna del agente).
 * Los HumanMessages y AIMessages finales (la conversación visible) se conservan
 * el mayor tiempo posible.
 */
function trimMessages(msgs: BaseMessage[]): BaseMessage[] {
  let result = [...msgs];

  while (result.length > MSG_HARD_CAP) {
    // Buscar el primer ToolMessage (huella de una llamada a herramienta)
    // en la primera mitad del array — nunca recortamos la cola reciente.
    const safeZone = Math.floor(result.length / 2);
    const toolIdx = result.findIndex((m, i) => i < safeZone && m._getType() === "tool");

    if (toolIdx > 0) {
      // Si el AIMessage anterior solo tenía tool_calls (sin texto), eliminarlo también
      const prev = result[toolIdx - 1];
      const prevIsToolCall =
        prev._getType() === "ai" &&
        !(prev as AIMessage).content &&
        ((prev as AIMessage).tool_calls?.length ?? 0) > 0;

      result.splice(prevIsToolCall ? toolIdx - 1 : toolIdx, prevIsToolCall ? 2 : 1);
    } else {
      // No hay tool pairs en la zona segura → corte duro desde el inicio
      result = result.slice(-MSG_HARD_CAP);
      // Eliminar tool messages huérfanos al inicio
      while (result.length > 0 && result[0]._getType() === "tool") {
        result.shift();
      }
      break;
    }
  }

  return result;
}

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => {
      const combined = x.concat(y);
      return combined.length <= MSG_HARD_CAP ? combined : trimMessages(combined);
    },
    default: () => [],
  }),
  activeProjectId: Annotation<string>({
    reducer: (x, y) => y ?? x, 
    default: () => "no-project-id", 
  }),
  activeEstimationId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "no-estimation-id",
  }),
  activeClientId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "no-client-id",
  }),
  clientData: Annotation<ClientData | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "FINISH",
  }),
});