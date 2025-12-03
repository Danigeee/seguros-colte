import { BaseMessage } from "@langchain/core/messages";

/**
 * Recorta el historial de mensajes de forma inteligente para evitar errores de OpenAI.
 * Mantiene los últimos N mensajes, pero asegura que no se rompa la cadena tool_call -> tool_result.
 * Si el corte empieza con un mensaje 'tool', lo descarta porque estaría huérfano.
 */
export function smartSliceMessages(messages: BaseMessage[], maxCount: number = 50): BaseMessage[] {
  // Si hay menos mensajes que el límite, devolver todo
  if (messages.length <= maxCount) {
    return messages;
  }

  // Tomar los últimos N mensajes
  let sliced = messages.slice(-maxCount);

  // Limpiar mensajes 'tool' huérfanos al inicio
  // Un mensaje 'tool' debe ir precedido por un AIMessage con tool_calls
  while (sliced.length > 0 && sliced[0]._getType() === "tool") {
    sliced.shift();
  }

  return sliced;
}
