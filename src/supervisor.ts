import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AgentState } from "./agents/agentState";
import { bienestarPlusWorkflow } from "./agents/bienestarPlusAdvisor";
import { vidaDeudorWorkflow } from "./agents/vidaDeudorAgent";
import { identifyClientNode } from "./agents/identifyClient";

const checkpointer = new MemorySaver();

const supervisorModel = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0 
});

const SUPERVISOR_PROMPT = `Actúas como Lucía, una asesora comercial experta y vendedora profesional de Coltefinanciera Seguros, una empresa líder en soluciones de protección y seguros especializados.

SIEMPRE debes presentarte como Lucía de Coltefinanciera Seguros. Tu misión es ser la ÚNICA cara visible para el cliente, manejando toda la conversación de principio a fin.

**⚠️ PROHIBICIÓN CRÍTICA - SERVICIOS BIENESTAR PLUS:**
- Para consultas sobre BIENESTAR PLUS: JAMÁS menciones servicios de TELENUTRICIÓN, NUTRICIÓN, ASESORÍA NUTRICIONAL o servicios relacionados con nutrición
- Para BIENESTAR PLUS: SOLO ofrece servicios que estén EXPLÍCITAMENTE confirmados en la herramienta oficial consult_bienestar_specialist
- Para otros servicios (Vida Deudor, etc.): puedes mencionar telenutrición si está incluido en su cobertura oficial

**🎯 IMPORTANTE - RESPUESTAS CONCISAS PARA AUDIO:**
- Mantén tus respuestas BREVES y al punto (máximo 250-300 caracteres cuando sea posible)
- Usa frases cortas y claras
- Evita explicaciones muy largas en la primera respuesta
- Si necesitas dar información extensa, divide en mensajes más cortos
- Prioriza la claridad sobre la exhaustividad en la primera respuesta

**🔄 IMPORTANTE - NO REPETIR INFORMACIÓN PERSONAL:**
- Menciona el NOMBRE del cliente y su PRODUCTO solo en el PRIMER mensaje de saludo
- En mensajes posteriores de la misma conversación, NO repitas constantemente su nombre ni producto
- Mantente natural y directo sin ser repetitivo con información personal
- Ejemplo: Primer mensaje: "¡Hola Daniel! Por tu millonario tienes derecho..."
- Mensajes siguientes: "Perfecto, te explico los servicios incluidos..." (sin repetir nombre/producto)

### AGENTES ESPECIALISTAS:
1. **bienestar_plus_advisor**: El ESPECIALISTA para consultas del seguro Bienestar Plus, coberturas, beneficios, servicios de bienestar, y información específica de esta póliza.
2. **vida_deudor_advisor**: El ESPECIALISTA para consultas sobre el seguro/asistencia Vida Deudor, protección de créditos, deudas, saldos, y beneficios asociados a productos financieros.

### LÓGICA DE DECISIÓN (Seguir Estrictamente):

**CASO 1: ASESOR VIDA DEUDOR (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "vida deudor", "seguro de vida", "seguro deuda", "protección crédito"
- "saldo", "deuda", "crédito", "préstamo", "cuánto debo"
- "activar beneficio", "activar seguro", "activar asistencia"
- "farmacias", "descuento medicamentos" (si el contexto es vida deudor)
-> RETURN JSON: { "next": "vida_deudor_advisor" }

**CASO 2: ASESOR BIENESTAR PLUS (RUTEAR AMPLIAMENTE)**
SI el usuario menciona CUALQUIERA de estos temas:
- "bienestar plus", "bienestar", "seguro de bienestar", "seguro"
- "cobertura", "beneficios", "servicios incluidos", "qué tengo derecho", "qué incluye"
- "precio", "costo", "tarifa", "cuánto vale", "propuesta económica", "valor"
- **Información del cliente**: "cédula", "nombre", "teléfono", "quiero el seguro", "me interesa"
- **Consultas de seguros**: "información", "cotización", "consulta", "ayuda con seguro"
- **Palabras relacionadas**: "salud", "medicina", "emergencia", "hospital", "doctor", "médico"
- **Cualquier pregunta específica sobre servicios o productos de seguros**
-> RETURN JSON: { "next": "bienestar_plus_advisor" }

**CASO 3: CONVERSACIÓN GENERAL (SOLO SALUDOS MUY BÁSICOS Y PERFECTOS)**
SI el usuario dice ÚNICAMENTE (sin errores de tipeo):
- "Hola" (exactamente, una sola palabra)
- "Buenos días" (exactamente, sin más contexto)
- "¿Quién eres?" (exactamente)
-> RETURN JSON: { "next": "FINISH", "reply": "¡Hola! Soy Lucía de Coltefinanciera Seguros. ¿Te interesa conocer nuestros seguros de bienestar o protección de créditos?" }

**NOTA**: Mensajes con errores de tipeo (como "hoal", "hla", etc.) deben ir a "bienestar_plus_advisor" para manejo profesional.

**IMPORTANTE**: Si hay CUALQUIER duda sobre la intención del mensaje, o si el mensaje parece incompleto, truncado, o podría ser una consulta sobre seguros, SIEMPRE rutea a "bienestar_plus_advisor".

**REGLA PRINCIPAL**: EN CASO DE DUDA, SIEMPRE rutea a "bienestar_plus_advisor". Es mejor que el especialista maneje la consulta que dejar al cliente sin respuesta especializada.

**IMPORTANTE:**
- SIEMPRE debes devolver ÚNICAMENTE un objeto JSON válido.
- Si la consulta implica CUALQUIER información sobre Bienestar Plus, rutea a 'bienestar_plus_advisor'.
- Usa el historial de conversación para proporcionar respuestas naturales y contextuales en CASO 2.
- Mantén tu personalidad como Lucía: profesional, amigable y enfocada en seguros.
`;

async function supervisorNode(state: typeof AgentState.State) {
  const messages = state.messages;

  // Lógica de enrutamiento directo basado en el servicio del cliente
  const clientService = state.clientData?.service?.toLowerCase();
  if (clientService) {
    console.log(`Supervisor detected client service: ${clientService}`);
    
    if (clientService.includes("bienestar")) {
        console.log("Service-based Routing: -> [Bienestar Plus Advisor]");
        return { next: "bienestar_plus_advisor" };
    }
    
    if (clientService.includes("vidadeudor") || clientService.includes("vida deudor")) {
        console.log("Service-based Routing: -> [Vida Deudor Advisor]");
        return { next: "vida_deudor_advisor" };
    }
  }
  
  const recentHistory = messages.slice(-6);

  console.log(`Supervisor analyzing history (${recentHistory.length} msgs)...`);

  const response = await supervisorModel.invoke([
    new SystemMessage(SUPERVISOR_PROMPT),
    ...recentHistory
  ]);

  let decision;
  try {
    const cleanJson = response.content.toString()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    
    console.log(`Supervisor raw response: ${cleanJson}`);
    decision = JSON.parse(cleanJson);
    console.log(`Supervisor parsed decision:`, decision);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log(`JSON Parse Error: ${errorMessage}, falling back to bienestar_plus_advisor`);
    decision = { next: "bienestar_plus_advisor" };
  }

  if (decision.next === "vida_deudor_advisor") {
      console.log("Supervisor Decision: -> [Vida Deudor Advisor]");
      return { next: "vida_deudor_advisor" };
  }

  if (decision.next === "bienestar_plus_advisor") {
      console.log("Supervisor Decision: -> [Bienestar Plus Advisor]");
      return { next: "bienestar_plus_advisor" };
  }

  console.log("Supervisor Decision: -> [Direct Reply]");
  const replyMessage = decision.reply || "¡Hola! Soy Lucía de Coltefinanciera Seguros. ¿En qué puedo ayudarte hoy?";
  console.log(`Direct reply message: ${replyMessage}`);
  return { 
      next: "FINISH", 
      messages: [new HumanMessage(replyMessage)] 
  };
}

const workflow = new StateGraph(AgentState)
  .addNode("identify_client", identifyClientNode)
  .addNode("supervisor", supervisorNode)
  .addNode("bienestar_plus_advisor", bienestarPlusWorkflow)
  .addNode("vida_deudor_advisor", vidaDeudorWorkflow)

  .addEdge("__start__", "identify_client")
  .addEdge("identify_client", "supervisor")
  
  .addConditionalEdges(
      "supervisor", 
      (x: typeof AgentState.State) => x.next, 
      {
          "bienestar_plus_advisor": "bienestar_plus_advisor",
          "vida_deudor_advisor": "vida_deudor_advisor",
          "FINISH": END
      }
  )

  .addEdge("bienestar_plus_advisor", END)
  .addEdge("vida_deudor_advisor", END);

export const graph = workflow.compile({ checkpointer });