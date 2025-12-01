import { Annotation } from "@langchain/langgraph";
export const AgentState = Annotation.Root({
    messages: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    activeProjectId: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "no-project-id",
    }),
    activeEstimationId: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "no-estimation-id",
    }),
    activeClientId: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "no-client-id",
    }),
    clientData: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    next: Annotation({
        reducer: (x, y) => y ?? x,
        default: () => "FINISH",
    }),
});
