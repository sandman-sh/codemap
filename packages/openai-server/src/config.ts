import dotenv from "dotenv";
import path from "path";
import OpenAI from "openai";

// Auto-load .env from process.cwd and workspace root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

export const getAiBaseUrl = () =>
  process.env.OPENROUTER_BASE_URL ??
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
  "https://openrouter.ai/api/v1";

export const aiBaseUrl = getAiBaseUrl();

export const getApiKey = () =>
  process.env.OPENROUTER_API_KEY ??
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
  "";

export const chatModel = process.env.AI_CHAT_MODEL || "openrouter/free";

export function createAiClient() {
  const apiKey = getApiKey();
  return new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL: aiBaseUrl,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5174",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_TITLE || "CodeMapAI",
    },
  });
}
