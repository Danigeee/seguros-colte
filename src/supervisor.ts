import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AgentState } from "./agents/agentState.js";
import { bienestarPlusWorkflow } from "./agents/bienestarPlusAdvisor.js";
import { vidaDeudorWorkflow } from "./agents/vidaDeudorAgent.js";
import { mascotasWorkflow } from "./agents/mascotasAdvisor.js";
import { soatWorkflow } from "./agents/soatAdvisor.js";
import { seguroAutosAdvisor } from "./agents/seguroAutosAdvisor.js";
import { dentixAdvisor } from "./agents/dentixAdvisor.js";
import { identifyClientNode } from "./agents/identifyClient.js";

const checkpointer = new MemorySaver();

const supervisorModel = new ChatOpenAI({ 
    model: "gpt-4.1-mini-2025-04-14", 
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
3. **mascotas_advisor**: El ESPECIALISTA para consultas del seguro de MASCOTAS, protección veterinaria, coberturas para perros y gatos, servicios veterinarios incluidos.
4. **soat_advisor**: El ESPECIALISTA para consultas del SOAT (Seguro Obligatorio de Accidentes de Tránsito), coberturas vehiculares obligatorias, precios según tipo de vehículo.
5. **seguro_autos_advisor**: El ESPECIALISTA para consultas del seguro de AUTOS, protección vehicular integral, coberturas todo riesgo, responsabilidad civil, y servicios automotrices incluidos.
6. **dentix_advisor**: El ESPECIALISTA para consultas del seguro DENTAL DENTIX, tratamientos odontológicos cubiertos, red de odontólogos, copagos y servicios de salud oral.

### LÓGICA DE DECISIÓN (Seguir Estrictamente):

**CASO 1: ASESOR VIDA DEUDOR (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "vida deudor", "seguro de vida", "seguro deuda", "protección crédito"
- "saldo", "deuda", "crédito", "préstamo", "cuánto debo"
- "activar beneficio", "activar seguro", "activar asistencia"
- "farmacias", "descuento medicamentos" (si el contexto es vida deudor)
-> RETURN JSON: { "next": "vida_deudor_advisor" }

**CASO 2: ASESOR MASCOTAS (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "mascotas", "mascota", "seguro mascotas", "seguro de mascotas"
- "perro", "perros", "gato", "gatos", "cachorro", "gatito"
- "veterinario", "veterinaria", "vet", "clínica veterinaria"
- "peludo", "peluda", "mi perrito", "mi gatito", "mi mascota"
- "vacunas mascota", "enfermedad mascota", "cirugía mascota"
- "proteger mascota", "cuidar mascota", "salud mascota"
-> RETURN JSON: { "next": "mascotas_advisor" }

**CASO 3: ASESOR SOAT (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "soat", "SOAT", "seguro obligatorio", "seguro de tránsito"
- "renovar soat", "comprar soat", "necesito soat"
- "papeles del carro", "papeles de la moto", "documentos vehículo"
- "multa soat", "soat vencido", "soat vigente"
-> RETURN JSON: { "next": "soat_advisor" }

**CASO 4: ASESOR SEGURO AUTOS (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "seguro de autos", "seguro auto", "seguro vehicular", "seguro de vehículo"
- "todo riesgo", "responsabilidad civil", "cobertura amplia", "full cover"
- "choque", "accidente", "daños", "robo de auto", "hurto vehicular"
- "valor comercial", "deducible", "prima", "tarifa auto"
- "grúa", "auxilio mecánico", "asistencia vial", "conductor elegido"
- "proteger mi carro", "asegurar mi auto", "cobertura completa"
- "marca", "modelo", "año del vehículo" (en contexto de seguro)
-> RETURN JSON: { "next": "seguro_autos_advisor" }

**CASO 5: ASESOR DENTIX (PRIORIDAD ALTA)**
SI el usuario menciona CUALQUIERA de estos temas:
- "dentix", "seguro dental", "seguro de dientes", "cobertura dental"
- "odontólogo", "dentista", "clínica dental", "consulta dental"
- "dientes", "muelas", "caries", "endodoncia", "extracción"
- "ortodoncia", "brackets", "limpieza dental", "profilaxis"
- "dolor de muela", "emergencia dental", "urgencia dental"
- "cirugía oral", "implantes", "prótesis dental", "coronas"
- "proteger mi sonrisa", "salud oral", "higiene dental"
-> RETURN JSON: { "next": "dentix_advisor" }

**CASO 6: ASESOR BIENESTAR PLUS (RUTEAR AMPLIAMENTE)**
SI el usuario menciona CUALQUIERA de estos temas:
- "bienestar plus", "bienestar", "seguro de bienestar", "seguro"
- "cobertura", "beneficios", "servicios incluidos", "qué tengo derecho", "qué incluye"
- "precio", "costo", "tarifa", "cuánto vale", "propuesta económica", "valor"
- **Información del cliente**: "cédula", "nombre", "teléfono", "quiero el seguro", "me interesa"
- **Consultas de seguros**: "información", "cotización", "consulta", "ayuda con seguro"
- **Palabras relacionadas**: "salud", "medicina", "emergencia", "hospital", "doctor", "médico"
- **Cualquier pregunta específica sobre servicios o productos de seguros**
-> RETURN JSON: { "next": "bienestar_plus_advisor" }

**CASO 7: CONVERSACIÓN GENERAL (SOLO SALUDOS MUY BÁSICOS Y PERFECTOS)**
SI el usuario dice ÚNICAMENTE (sin errores de tipeo):
- "Hola" (exactamente, una sola palabra)
- "Buenos días" (exactamente, sin más contexto)
- "¿Quién eres?" (exactamente)
-> RETURN JSON: { "next": "FINISH", "reply": "¡Hola! Soy Lucía de Coltefinanciera Seguros. ¿Te interesa conocer nuestros seguros de bienestar, mascotas, SOAT o protección de créditos?" }

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
        console.log("🔄 [Supervisor] Handing over to Bienestar Plus Advisor (Service Routing)");
        return { next: "bienestar_plus_advisor" };
    }
    
    if (clientService.includes("mascotas")) {
        console.log("Service-based Routing: -> [Mascotas Advisor]");
        return { next: "mascotas_advisor" };
    }
    
    if (clientService.includes("soat")) {
        console.log("Service-based Routing: -> [SOAT Advisor]");
        return { next: "soat_advisor" };
    }
    
    if (clientService.includes("vidadeudor") || clientService.includes("vida deudor")) {
        console.log("Service-based Routing: -> [Vida Deudor Advisor]");
        return { next: "vida_deudor_advisor" };
    }
    
    if (clientService.includes("autos")) {
        console.log("Service-based Routing: -> [Seguro Autos Advisor]");
        return { next: "seguro_autos_advisor" };
    }
    
    if (clientService.includes("dentix")) {
        console.log("Service-based Routing: -> [Dentix Advisor]");
        return { next: "dentix_advisor" };
    }
  }
  
  const recentHistory = messages.slice(-6);

  // console.log(`Supervisor analyzing history (${recentHistory.length} msgs)...`);

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
    
    // console.log(`Supervisor raw response: ${cleanJson}`);
    decision = JSON.parse(cleanJson);
    // console.log(`Supervisor parsed decision:`, decision);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log(`JSON Parse Error: ${errorMessage}, falling back to bienestar_plus_advisor`);
    decision = { next: "bienestar_plus_advisor" };
  }

  if (decision.next === "vida_deudor_advisor") {
      console.log("Supervisor Decision: -> [Vida Deudor Advisor]");
      return { next: "vida_deudor_advisor" };
  }

  if (decision.next === "mascotas_advisor") {
      console.log("Supervisor Decision: -> [Mascotas Advisor]");
      return { next: "mascotas_advisor" };
  }

  if (decision.next === "soat_advisor") {
      console.log("Supervisor Decision: -> [SOAT Advisor]");
      return { next: "soat_advisor" };
  }

  if (decision.next === "seguro_autos_advisor") {
      console.log("Supervisor Decision: -> [Seguro Autos Advisor]");
      return { next: "seguro_autos_advisor" };
  }

  if (decision.next === "dentix_advisor") {
      console.log("Supervisor Decision: -> [Dentix Advisor]");
      return { next: "dentix_advisor" };
  }

  if (decision.next === "bienestar_plus_advisor") {
      console.log("Supervisor Decision: -> [Bienestar Plus Advisor]");
      // console.log("🔄 [Supervisor] Handing over to Bienestar Plus Advisor (LLM Decision)");
      return { next: "bienestar_plus_advisor" };
  }

  console.log("Supervisor Decision: -> [Direct Reply]");
  const replyMessage = decision.reply || "¡Hola! Soy Lucía de Coltefinanciera Seguros. ¿En qué puedo ayudarte hoy?";
  // console.log(`Direct reply message: ${replyMessage}`);
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
  .addNode("mascotas_advisor", mascotasWorkflow)
  .addNode("soat_advisor", soatWorkflow)
  .addNode("seguro_autos_advisor", seguroAutosAdvisor)
  .addNode("dentix_advisor", dentixAdvisor)

  .addEdge("__start__", "identify_client")
  .addEdge("identify_client", "supervisor")
  
  .addConditionalEdges(
      "supervisor", 
      (x: typeof AgentState.State) => x.next, 
      {
          "bienestar_plus_advisor": "bienestar_plus_advisor",
          "vida_deudor_advisor": "vida_deudor_advisor",
          "mascotas_advisor": "mascotas_advisor",
          "soat_advisor": "soat_advisor",
          "seguro_autos_advisor": "seguro_autos_advisor",
          "dentix_advisor": "dentix_advisor",
          "FINISH": END
      }
  )

  .addEdge("bienestar_plus_advisor", END)
  .addEdge("vida_deudor_advisor", END)
  .addEdge("mascotas_advisor", END)
  .addEdge("soat_advisor", END)
  .addEdge("seguro_autos_advisor", END)
  .addEdge("dentix_advisor", END);

export const graph = workflow.compile({ checkpointer });