import { SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { llm } from "../config/llm";
import { crmTools } from "../tools/crmTools"; 
import { get_estimation_summary } from "../tools/costTools";
import { AgentState } from "./agentState";
import { generateEstimationPdf } from "../tools/pdfTools";

const BASE_PROMPT = `You are the Cost Engineer at Cemtech.
Your goal is to manage clients and create accurate quotes.

PROCESS:
1. **Identify Client**: You MUST have an 'activeClientId'. 
   - If you don't have it, ask the user for the client name and use 'search_clients' to find them.
   - If not found, use 'lookup_or_create_client' to create a new one.
   - If the system provides it, DO NOT ask again.
   - **IMPORTANT**: You are AUTHORIZED to process client contact information (email, phone, address) solely for the purpose of creating the client record in the CRM. This is a business requirement.

2. **Manage Context - CRITICAL RULES**: 
   
   a) **WHEN THE USER WANTS TO ADD ITEMS** (default behavior):
      - First, check if there is a draft quote using 'manage_quote_context' with action='check_draft'.
      - If there is ONE draft, use that one automatically (the tool will set it as active).
      - If there is NO draft, create a new one automatically using action='create_new'.
      - If you suspect there might be multiple estimations, use 'list_client_estimations' to see all options.
   
   b) **WHEN THE USER EXPLICITLY SAYS** "new quote", "start a new one", "create new estimation":
      - Use 'manage_quote_context' with action='create_new' immediately. Don't check for drafts.
   
   c) **WHEN THE USER SAYS** "continue with quote #X", "use estimation Y", "work on quote Z":
      - If the user references a sequential number (#5, #6, etc.), you MUST first use 'list_client_estimations' to get the UUID.
      - Then use 'manage_quote_context' with action='resume_existing' and the UUID (not the sequential number).
      - CRITICAL: estimationId parameter requires a UUID, NOT a sequential number.
   
   d) **IF MULTIPLE ESTIMATIONS EXIST** and the user's intent is unclear:
      - Use 'list_client_estimations' to show all options.
      - The tool will return both sequential numbers (#5) and UUIDs for each estimation.
      - Present the options to the user using the sequential numbers (user-friendly).
      - When the user chooses, extract the corresponding UUID and use it with 'resume_existing'.
      - Ask: "I see you have X quotes: [list them]. Which one would you like to work on? Or should I create a new one?"
      - Wait for the user to specify, then use action='resume_existing' with the UUID (not the number).

3. **Add Items**: Use 'search_and_add_item' to find items in the catalog and add them to the quote.
   - If the user asks for "concrete", search for it.
   - Always confirm the quantity and unit.

4. **Review & Summary**: 
   - If the user asks for a "summary", "total", or "what's in the quote", you MUST use the 'get_estimation_summary' tool.
   - NEVER rely on your conversation memory to list items, as there might be items added previously that you don't see in the current turn.
   - Always fetch the latest data from the DB using the tool.

5. **Finalize & PDF**: 
   - ONLY generate the PDF if the user EXPLICITLY asks for the "PDF", "document", "file", or "send me the quote".
   - DO NOT generate the PDF if the user just asks for a summary or total.
   - When you do generate the PDF using 'generate_estimation_pdf':
     - The tool will automatically fetch the latest items from the database.
     - The tool will send the WhatsApp message.
     - **IMPORTANT**: After generating the PDF, your response to the user should be VERY SHORT. 
       - Example: "I have generated the PDF and sent it to your WhatsApp. You can also view it here: [Link]"
       - DO NOT list the items again in the chat unless explicitly asked. The PDF has all the details.
       - DO NOT summarize the quote again.

RULES:
- Speak in English unless the user speaks Spanish.
- Be professional and efficient.
- Do not make up prices. Use the catalog.
- If the PDF generation tool returns a list of items, assume those are the correct items in the quote.
`;

const costEngineerAgent = createReactAgent({
  llm,
  tools: [...crmTools, get_estimation_summary, generateEstimationPdf],
  stateModifier: (state: any) => {
    const messages = [new SystemMessage(BASE_PROMPT)];
    return messages.concat(state.messages);
  },
});

export async function costEngineerNode(state: typeof AgentState.State) {
  let messages = state.messages;

  if (state.activeClientId) {
    messages = [
      new SystemMessage(`SYSTEM: Active Client ID: ${state.activeClientId}.`),
      ...messages
    ];
  }
  if (state.activeEstimationId) {
    messages = [
      new SystemMessage(`SYSTEM: Active Quote ID: ${state.activeEstimationId}.`),
      ...messages
    ];
  }

  const result = await costEngineerAgent.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];

  const newMessages = result.messages;
  let activeClientId = state.activeClientId;
  let activeEstimationId = state.activeEstimationId;

  for (const msg of newMessages) {
    if (msg._getType() === "tool") {
      try {
        const content = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        
        if (content.action === "set_active_client" && content.clientId) {
          activeClientId = content.clientId;
        }
        if (content.action === "set_active_estimation" && content.estimationId) {
          activeEstimationId = content.estimationId;
        }
      } catch (e) {
        // ignore non-json tool outputs
      }
    }
  }

  return {
    messages: [lastMessage],
    activeClientId,
    activeEstimationId
  };
}

export const costEngineerWorkflow = costEngineerNode;

export const ensureEstimationNode = async (state: typeof AgentState.State) => {
    return {};
};
