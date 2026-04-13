import { MongoClient } from "mongodb";

const MONGODB_URI = Bun.env.MONGODB_URI || "";
const MONGODB_DB_NAME = Bun.env.MONGODB_DB_NAME;
const MONGODB_COLLECTION_NAME = Bun.env.MONGODB_COLLECTION_NAME || "";

const mongoClient = new MongoClient(MONGODB_URI);

const mongoDatabase = mongoClient.db(MONGODB_DB_NAME);
const mongoCollection = mongoDatabase.collection(MONGODB_COLLECTION_NAME);

const connectMongoAtlas = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI");
  }
  if (!MONGODB_DB_NAME) {
    throw new Error("Missing MONGODB_DB_NAME");
  }
  if (!MONGODB_COLLECTION_NAME) {
    throw new Error("Missing MONGODB_COLLECTION_NAME");
  }

  try {
    await mongoClient.connect();
    await mongoDatabase.command({ ping: 1 });
    console.log("[MongoDB] Connected successfully.");
  } catch (err) {
    await mongoClient.close();
    const message = err instanceof Error ? err.message : "Unknown MongoDB error";
    console.error("[MongoDB] Connection failed:", message);
    throw err;
  }
};

export { mongoClient, connectMongoAtlas, mongoCollection };
