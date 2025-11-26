import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
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
  next: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "FINISH",
  }),
});