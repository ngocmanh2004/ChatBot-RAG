import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  routePrompt,
  reWriteQueryPrompt,
  documentEvaluatorPrompt,
  generateAnswerPrompt,
} from "./prompt.util";

const createClassificationChain = (llm: ChatGoogleGenerativeAI) => {
  return RunnableSequence.from([
    routePrompt,
    llm,
    new StringOutputParser(),
  ]);
};

const createRewriteQueryChain = (llm: ChatGoogleGenerativeAI) => {
  return RunnableSequence.from([
    reWriteQueryPrompt,
    llm,
    new StringOutputParser()
  ]);
};

const createDocumentEvaluatorChain = (llm: ChatGoogleGenerativeAI) => {
  return RunnableSequence.from([
    documentEvaluatorPrompt,
    llm,
    new StringOutputParser(),
  ]);
};

const createStreamingAnswerChain = (llm: ChatGoogleGenerativeAI) => {
  return RunnableSequence.from([
    generateAnswerPrompt,
    llm,
    new StringOutputParser(),
  ]);
};

export {
  createClassificationChain,
  createRewriteQueryChain,
  createDocumentEvaluatorChain,
  createStreamingAnswerChain
};