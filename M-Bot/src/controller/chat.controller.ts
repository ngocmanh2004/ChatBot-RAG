import type { Request, Response } from "express";
import processUserQuery from "../services/chat.service";
import {
  createChatSession,
  getAllChatSessions,
  getChatHistory,
  clearChatHistory,
  deleteChatSession,
  deleteAllChatSessions,
} from "../services/conversations.service";
import { successResponse, errorResponse } from "../utils/response.util";

const createSessionController = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const sessionId = await createChatSession(userId);
    successResponse(res, 201, sessionId)
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

const getAllChatSessionsController = async (req: Request, res: Response) => {
  try {
    const sessions = await getAllChatSessions(Number(req.params.id));
    successResponse(res, 200, sessions);
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

const getSessionHistoryController = async (req: Request, res: Response) => {
  try {
    const messages = await getChatHistory(req.params.id);
    successResponse(res, 200, messages);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Session not found!") {
        errorResponse(res, 404, "Not Found", err.message);
        return
      }
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

const streamMessageController = async (req: Request, res: Response) => {
  const { message } = req.body;

  try {
    const responseText = await processUserQuery(message, req.params.id);
    successResponse(res, 200, { responseText });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Session not found!") {
        errorResponse(res, 404, "Not Found", err.message);
        return
      }
      errorResponse(
        res,
        500,
        "Internal Server Error",
        `Chat processing failed: ${err.message}`
      );
    }

  }
};

const clearSessionHistoryController = async (req: Request, res: Response) => {
  try {
    await clearChatHistory(req.params.id);
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Session not found!") {
        errorResponse(res, 404, "Not Found", err.message);
        return
      }
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

const deleteSessionController = async (req: Request, res: Response) => {
  try {
    await deleteChatSession(req.params.id);
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Session not found!") {
        errorResponse(res, 404, "Not Found", err.message);
        return
      }
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }

  }
};

const deleteAllChatSessionsController = async (req: Request, res: Response) => {
  try {
    await deleteAllChatSessions(Number(req.params.id));
    res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorResponse(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later!");
    }
  }
};

export {
  createSessionController,
  getAllChatSessionsController,
  getSessionHistoryController,
  streamMessageController,
  clearSessionHistoryController,
  deleteSessionController,
  deleteAllChatSessionsController,
};
