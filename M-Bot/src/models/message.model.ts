import type { MessageContent } from "@langchain/core/messages";

interface Message {
    role: "user" | "assistant";
    content: MessageContent;
}

export type { Message as default };