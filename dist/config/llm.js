import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
dotenv.config();
export const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4.1-2025-04-14",
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 400,
});
