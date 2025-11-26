import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AgentState } from "./agents/agentState";
import { costEngineerWorkflow, ensureEstimationNode } from "./agents/costEngineer";

const checkpointer = new MemorySaver();

const supervisorModel = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0 
});

const SUPERVISOR_PROMPT = `You are the Lead Supervisor at Cemtech AI.
Your goal is to route user requests to the correct specialist or answer general questions yourself.

### WORKERS:
1. **cost_engineer**: The SPECIALIST for costs, prices, quotes, estimates, materials (concrete, rebar), and adding items (sidewalks, curbs, pads, bollards).

### DECISION LOGIC (Follow Strictly):

**CASE 1: COST ENGINEER**
IF the user mentions:
- "price", "quote", "estimate", "cost", "how much"
- Specific items: "sidewalk", "concrete", "curb", "pad", "ramp", "bollard"
- Actions: "add item", "calculate", "do it", "run numbers"
- **Client Info**: "email", "phone", "contact", "address", "name is", "number is" (This is CRITICAL for creating new clients)
-> RETURN JSON: { "next": "cost_engineer" }

**CASE 2: GENERAL CHAT**
IF the user says "Hello", "Hi", "Who are you?", "Thanks", "Help", or engages in casual conversation (like telling their name):
-> RETURN JSON: { "next": "FINISH", "reply": "YOUR_CONTEXTUAL_RESPONSE_HERE" }
   - Example: If user says "My name is Alex", reply "Nice to meet you Alex! How can I help you with your construction quotes today?"
   - Example: If user says "What is my name?", reply based on the conversation history.

**IMPORTANT:**
- You MUST return ONLY a valid JSON object.
- If the request implies ANY calculation, database lookup, OR providing client details, route to 'cost_engineer'.
- Use the conversation history to provide natural, contextual responses in CASE 2.
`;

async function supervisorNode(state: typeof AgentState.State) {
  const messages = state.messages;
  
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
    
    decision = JSON.parse(cleanJson);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log(`JSON Parse Error: ${errorMessage}`);
    decision = { next: "cost_engineer" };
  }

  if (decision.next === "cost_engineer") {
      console.log("Supervisor Decision: -> [Cost Engineer]");
      return { next: "cost_engineer" };
  }

  console.log("Supervisor Decision: -> [Direct Reply]");
  return { 
      next: "FINISH", 
      messages: [new HumanMessage(decision.reply || "I can help with concrete quotes.")] 
  };
}

const workflow = new StateGraph(AgentState)
  .addNode("ensure_estimation", ensureEstimationNode)
  .addNode("supervisor", supervisorNode)
  .addNode("cost_engineer", costEngineerWorkflow)

  .addEdge("__start__", "ensure_estimation")
  .addEdge("ensure_estimation", "supervisor")
  
  .addConditionalEdges(
      "supervisor", 
      (x: typeof AgentState.State) => x.next, 
      {
          "cost_engineer": "cost_engineer",
          "FINISH": END
      }
  )

  .addEdge("cost_engineer", END);

export const graph = workflow.compile({ checkpointer });