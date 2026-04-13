import { v4 as uuidv4 } from "uuid";
import { mongoCollection } from "../config/mongodb.config";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import type Message from "../models/message.model";

type ApiProvider = "pinecone" | "tavily" | "google" | "main_backend";

interface ApiInteractionLog {
  sessionId?: string;
  conversationId?: string;
  provider: ApiProvider;
  endpoint?: string;
  query?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  metadata?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

type ConversationRecord = Record<string, unknown>;

const createChatSession = async (userId: number) => {
  const sessionId = uuidv4();

  const chatMessage = {
    _id: sessionId,
    doc_type: "chat_session",
    userId,
    createdAt: new Date(),
  };

  try {
    await mongoCollection.insertOne(chatMessage as any);
    return sessionId;
  } catch (err) {
    throw err;
  }
};

const getAllChatSessions = async (userId: number) => {
  try {
    const sessions = await mongoCollection.find(
        {
          userId: userId,
          $or: [{ doc_type: "chat_session" }, { doc_type: { $exists: false } }],
        },
        { projection: { _id: 1} }
    )
    .sort({ createdAt: -1 }).toArray();

    const sessionIds = sessions.map(session => session._id);

    return sessionIds; 
  } catch (err) {
    throw err; 
  }
};

const getChatHistory = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    const messages = await chatMessageHistory.getMessages();

    const simplifiedMessages = messages.map(msg => {
      let role: "user" | "assistant" = "user"; 
      const messageType = msg.getType()

      if (messageType === "human") {
        role = 'user'; 
      } else if (messageType === "ai") {
        role = 'assistant'; 
      }

      return {
        role: role,
        content: msg.content 
      };
    });

    return simplifiedMessages;

  } catch (err) {
    throw err;
  }
};

const addMessageToHistory = async (sessionId: string, message: Message) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    if (message.role === "user") {
      await chatMessageHistory.addMessage(new HumanMessage({ content: message.content }));
    } else if (message.role === "assistant") {
      await chatMessageHistory.addMessage(new AIMessage({ content: message.content }));
    }
  } catch (err) {
    throw err;
  }
};

const clearChatHistory = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    await chatMessageHistory.clear();
  } catch (err) {
    throw err;
  }
};

const deleteChatSession = async (sessionId: string) => {
  try {
    const existedSession = await mongoCollection.findOne({ _id: sessionId } as any);
    if (!existedSession) {
      throw new Error("Session not found!");
    }

    const chatMessageHistory = new MongoDBChatMessageHistory({
      collection: mongoCollection,
      sessionId: sessionId,
    });

    await chatMessageHistory.clear();
    
    await mongoCollection.deleteOne({ _id: sessionId } as any);
  } catch (err) {
    throw err;
  }
};

const deleteAllChatSessions = async (userId: number) => {
  try {
    const sessions = await mongoCollection.find({
      userId: userId,
      $or: [{ doc_type: "chat_session" }, { doc_type: { $exists: false } }],
    }).toArray();

    const clearPromises = sessions.map(session => {
      const chatMessageHistory = new MongoDBChatMessageHistory({
        collection: mongoCollection,
        sessionId: session._id.toString(),
      });
      
      return chatMessageHistory.clear();
    });

    await Promise.allSettled(clearPromises);
    await mongoCollection.deleteMany({
      userId: userId,
      $or: [{ doc_type: "chat_session" }, { doc_type: { $exists: false } }],
    });
  } catch (err) {
    throw err;
  }
};

const saveConversation = async (conversation: ConversationRecord) => {
  const existingId =
    typeof conversation._id === "string"
      ? conversation._id
      : typeof conversation.conversationId === "string"
        ? conversation.conversationId
        : `conv_${uuidv4()}`;

  const now = new Date();

  try {
    await mongoCollection.updateOne(
      { _id: existingId, doc_type: "conversation_record" } as any,
      {
        $set: {
          ...conversation,
          _id: existingId,
          conversationId: existingId,
          doc_type: "conversation_record",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      } as any,
      { upsert: true }
    );

    return existingId;
  } catch (err) {
    throw err;
  }
};

const getConversationById = async (conversationId: string) => {
  try {
    return await mongoCollection.findOne({
      _id: conversationId,
      doc_type: "conversation_record",
    } as any);
  } catch (err) {
    throw err;
  }
};

const saveApiInteraction = async (interaction: ApiInteractionLog) => {
  const interactionId = `interaction_${uuidv4()}`;

  try {
    await mongoCollection.insertOne({
      _id: interactionId,
      interactionId,
      doc_type: "api_interaction",
      ...interaction,
      createdAt: new Date(),
    } as any);

    if (interaction.conversationId) {
      await mongoCollection.updateOne(
        {
          _id: interaction.conversationId,
          doc_type: "conversation_record",
        } as any,
        {
          $push: { interactionIds: interactionId },
          $set: { updatedAt: new Date() },
        } as any
      );
    }

    return interactionId;
  } catch (err) {
    throw err;
  }
};

const safeSaveApiInteraction = async (interaction: ApiInteractionLog) => {
  try {
    await saveApiInteraction(interaction);
  } catch (err) {
    console.error("[MongoDB] Failed to persist API interaction:", err);
  }
};

export {
  createChatSession,
  getAllChatSessions,
  getChatHistory,
  addMessageToHistory,
  clearChatHistory,
  deleteChatSession,
  deleteAllChatSessions,
  saveConversation,
  getConversationById,
  saveApiInteraction,
  safeSaveApiInteraction,
};
