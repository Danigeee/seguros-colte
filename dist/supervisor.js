import dotenv from "dotenv";
import { END } from "@langchain/langgraph";
import { z } from "zod";
import { ChatPromptTemplate, MessagesPlaceholder, } from "@langchain/core/prompts";
import { START, StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./agents/agentState";
import { salesServiceNode } from "./agents/salesServiceAgent";
import { technicalServiceNode } from "./agents/technicalServiceAgent";
import { customerServiceNode } from "./agents/customerServiceAgent";
import { llm } from "./config/llm";
dotenv.config();
const checkpointer = new MemorySaver();
const members = [
    "sales_service",
    "technical_service",
    "customer_service",
];
const systemPrompt = "You are a supervisor tasked with managing a conversation between the" +
    " following workers: {members}. Given the following user request," +
    " respond with the worker to act next. Each worker will perform a" +
    " task and respond with their results and status. When finished," +
    " respond with FINISH.";
const options = [END, ...members];
// Define the routing function
const routingTool = {
    name: "route",
    description: "Select the next role.",
    schema: z.object({
        next: z.enum([END, ...members]),
    }),
};
const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
    [
        "human",
        "Given the conversation above, who should act next?" +
            " Or should we FINISH? Select one of: {options}",
    ],
]);
const formattedPrompt = await prompt.partial({
    options: options.join(", "),
    members: members.join(", "),
});
const supervisorChain = formattedPrompt
    .pipe(llm.bindTools([routingTool], {
    tool_choice: "route",
}))
    // select the first one
    // @ts-ignore
    .pipe((x) => x.tool_calls[0].args);
// --------------------------------
//* Explicación de código:
// --------------------------------
// workflow es un gráfico de estados que define el flujo de trabajo de los agentes.
// El gráfico de estados contiene nodos que realizan tareas y bordes que conectan los nodos.
// Los nodos son funciones que procesan mensajes y devuelven mensajes.
// Los bordes son transiciones entre nodos que se activan cuando se cumple una condición.
// --------------------------------
// 1. Create the graph
const workflow = new StateGraph(AgentState)
    // 2. Add the nodes; these will do the work
    .addNode("supervisor", supervisorChain, {
    ends: ["sales_service", "technical_service", "customer_service", "__end__"],
})
    .addNode("sales_service", salesServiceNode, {
    ends: ["supervisor"],
})
    .addNode("technical_service", technicalServiceNode, {
    ends: ["supervisor"],
})
    .addNode("customer_service", customerServiceNode, {
    ends: ["supervisor"],
});
// 3. Define the edges. We will define both regular and conditional ones
// After a worker completes, report to supervisor
// members.forEach((member) => {
//   workflow.addEdge(member, "supervisor");
// });
workflow.addConditionalEdges("supervisor", (x) => x.next);
workflow.addEdge(START, "supervisor");
export const graph = workflow.compile({
    checkpointer,
});
