import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import initChatRoutes from "./src/routes/chat.route";
import initProductsRoutes from "./src/routes/products.route";
import { connectMongoAtlas } from "./src/config/mongodb.config";
import { syncAllDocumentsToVectorStore } from "./src/services/vectorStore.service";

const PORT = Number(Bun.env.PORT);
const AUTO_SYNC_ON_START = (Bun.env.AUTO_SYNC_ON_START || "true") === "true";
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }

      return compression.filter(req, res);
    },
  })
);

initChatRoutes(app);
initProductsRoutes(app);

connectMongoAtlas()
  .then(async () => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server đang chạy trên cổng ${PORT}`);
    });

    if (!AUTO_SYNC_ON_START) {
      return;
    }

    try {
      const totalDocuments = await syncAllDocumentsToVectorStore();
      console.log(`[VectorStore] Startup sync completed. Total documents: ${totalDocuments}`);
    } catch (err) {
      console.error("[VectorStore] Startup sync failed:", err);
    }
  })
  .catch((_err: unknown) => {
    process.exit(1);
  });
