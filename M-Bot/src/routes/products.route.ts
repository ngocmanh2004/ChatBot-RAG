import express from "express";
import type { Application } from "express";
import {
  syncProductsController,
  previewProductsController,
  previewVectorController,
} from "../controller/products.controller";

const router = express.Router();

const initProductsRoutes = (app: Application) => {
  router.post(
    "/sync",
    syncProductsController
  );
  router.get("/preview", previewProductsController);
  router.get("/vector-preview", previewVectorController);

  return app.use("/api/v1/products", router);
};

export default initProductsRoutes;
