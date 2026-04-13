import express from "express";
import type { Application, Request } from "express";
import {
  checkNotEmpty,
  checkIntegerNumber,
} from "../validation/auth.validation";
import { validate } from "../middleware/auth.middleware";
import {
  createSessionController,
  getAllChatSessionsController,
  getSessionHistoryController,
  streamMessageController,
  clearSessionHistoryController,
  deleteSessionController,
  deleteAllChatSessionsController,
} from "../controller/chat.controller";

const router = express.Router();

const initChatRoutes = (app: Application) => {
  router.post(
    "/",
    validate((req: Request) => {
      checkNotEmpty(req.body.userId, "User ID");
      checkIntegerNumber(req.body.userId, "User ID");
    }),
    createSessionController
  );
  router.get(
    "/users/:id",
    getAllChatSessionsController
  );
  router.get(
    "/:id",
    getSessionHistoryController
  );
  router.post(
    "/:id",
    validate((req: Request) => {
      checkNotEmpty(req.body.message, "Message");
    }),
    streamMessageController
  );
  router.delete(
    "/:id/clear",
    clearSessionHistoryController
  );
  router.delete(
    "/:id",
    deleteSessionController
  );
  router.delete(
    "/users/:id",
    deleteAllChatSessionsController
  );
  return app.use("/api/v1/sessions", router);
};

export default initChatRoutes;
