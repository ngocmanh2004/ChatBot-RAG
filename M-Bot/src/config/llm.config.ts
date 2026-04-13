import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const GOOGLE_API_KEY = Bun.env.GOOGLE_API_KEY;
const LLM_MODEL_NAME = Bun.env.LLM_MODEL_NAME;
const LLM_VERBOSE = (Bun.env.LLM_VERBOSE || "false") === "true";
const LLM_MAX_RETRIES = Number(Bun.env.LLM_MAX_RETRIES || "1");

const initLLM = () =>
  new ChatGoogleGenerativeAI({
    apiKey: GOOGLE_API_KEY,
    modelName: LLM_MODEL_NAME,
    maxOutputTokens: 1500,
    temperature: 0.3,
    streaming: true,
    verbose: LLM_VERBOSE,
    maxRetries: LLM_MAX_RETRIES,
  });

export default initLLM;
