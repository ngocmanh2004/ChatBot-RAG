import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const GOOGLE_API_KEY = Bun.env.GOOGLE_API_KEY;
const LLM_EMBEDDING_MODEL_NAME = Bun.env.LLM_EMBEDDING_MODEL_NAME;

const initEmbeddingModel = (taskType: TaskType) =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: GOOGLE_API_KEY,
    taskType: taskType,
    modelName: LLM_EMBEDDING_MODEL_NAME,
  });

export default initEmbeddingModel
