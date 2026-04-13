import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "fs";
import * as path from "path";

const DOCUMENTS_FOLDER = Bun.env.DOCUMENTS_FOLDER || "./documents";
const CHUNK_SIZE = Number(Bun.env.CHUNK_SIZE || "1000");
const CHUNK_OVERLAP = Number(Bun.env.CHUNK_OVERLAP || "200");

/**
 * Load documents from local folder
 * Supports: PDF, DOCX, TXT
 */
const loadDocumentsFromFolder = async (): Promise<Document[]> => {
  try {
    // Check if folder exists
    if (!fs.existsSync(DOCUMENTS_FOLDER)) {
      console.warn(`[Documents] Folder not found: ${DOCUMENTS_FOLDER}`);
      return [];
    }

    // Load all documents from folder
    const loader = new DirectoryLoader(DOCUMENTS_FOLDER, {
      ".pdf": (path) => new PDFLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".txt": (path) => new TextLoader(path),
    });

    const docs = await loader.load();
    console.log(`[Documents] Loaded ${docs.length} documents from ${DOCUMENTS_FOLDER}`);

    return docs;
  } catch (err) {
    console.error("[Documents] Failed to load documents:", err);
    return [];
  }
};

/**
 * Split documents into chunks for better retrieval
 */
const splitDocuments = async (documents: Document[]): Promise<Document[]> => {
  if (documents.length === 0) {
    return [];
  }

  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    const splitDocs = await textSplitter.splitDocuments(documents);
    console.log(`[Documents] Split into ${splitDocs.length} chunks`);

    return splitDocs;
  } catch (err) {
    console.error("[Documents] Failed to split documents:", err);
    return documents;
  }
};

/**
 * Get all document chunks ready for vector store
 */
const getAllDocumentChunks = async (): Promise<Document[]> => {
  try {
    const rawDocs = await loadDocumentsFromFolder();
    
    if (rawDocs.length === 0) {
      return [];
    }

    // Add metadata
    const docsWithMetadata = rawDocs.map((doc) => {
      const fileName = path.basename(doc.metadata.source || "unknown");
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          doc_type: "document",
          file_name: fileName,
          source: doc.metadata.source,
        },
      });
    });

    // Split into chunks
    const chunks = await splitDocuments(docsWithMetadata);

    return chunks;
  } catch (err) {
    console.error("[Documents] Failed to get document chunks:", err);
    return [];
  }
};

/**
 * List all documents in folder
 */
const listDocuments = (): string[] => {
  try {
    if (!fs.existsSync(DOCUMENTS_FOLDER)) {
      return [];
    }

    const files = fs.readdirSync(DOCUMENTS_FOLDER);
    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".pdf", ".docx", ".txt"].includes(ext);
    });
  } catch (err) {
    console.error("[Documents] Failed to list documents:", err);
    return [];
  }
};

export { getAllDocumentChunks, loadDocumentsFromFolder, listDocuments };
export default getAllDocumentChunks;
