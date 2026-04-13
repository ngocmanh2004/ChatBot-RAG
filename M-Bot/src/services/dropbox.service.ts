import { Dropbox } from "dropbox";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DROPBOX_ACCESS_TOKEN = Bun.env.DROPBOX_ACCESS_TOKEN || "";
const DROPBOX_ENABLED = Bun.env.DROPBOX_ENABLED === "true";
const DROPBOX_FOLDER_PATH = Bun.env.DROPBOX_FOLDER_PATH || "/";
const CHUNK_SIZE = Number(Bun.env.CHUNK_SIZE || "1000");
const CHUNK_OVERLAP = Number(Bun.env.CHUNK_OVERLAP || "200");

/**
 * Initialize Dropbox client
 */
const initDropboxClient = () => {
  if (!DROPBOX_ACCESS_TOKEN) {
    throw new Error("Missing DROPBOX_ACCESS_TOKEN");
  }

  return new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
};

/**
 * List all files in Dropbox folder
 */
const listFilesFromDropbox = async () => {
  if (!DROPBOX_ENABLED || !DROPBOX_ACCESS_TOKEN) {
    return [];
  }

  try {
    const dbx = initDropboxClient();

    const response = await dbx.filesListFolder({
      path: DROPBOX_FOLDER_PATH === "/" ? "" : DROPBOX_FOLDER_PATH,
      recursive: true,
    });

    const files = response.result.entries.filter((entry) => {
      if (entry[".tag"] !== "file") return false;

      const fileName = entry.name.toLowerCase();
      return (
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".txt")
      );
    });

    console.log(`[Dropbox] Found ${files.length} supported files`);
    return files;
  } catch (err) {
    console.error("[Dropbox] Failed to list files:", err);
    return [];
  }
};

/**
 * Download file from Dropbox to temp folder
 */
const downloadFileFromDropbox = async (
  filePath: string,
  fileName: string
): Promise<string | null> => {
  try {
    const dbx = initDropboxClient();

    const tempDir = path.join(os.tmpdir(), "rag-dropbox");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const localPath = path.join(tempDir, fileName);

    const response = await dbx.filesDownload({ path: filePath });

    // @ts-ignore - Dropbox SDK types issue
    const fileBlob = response.result.fileBinary;

    if (fileBlob) {
      fs.writeFileSync(localPath, Buffer.from(fileBlob));
      console.log(`[Dropbox] Downloaded: ${fileName}`);
      return localPath;
    }

    return null;
  } catch (err) {
    console.error(`[Dropbox] Failed to download ${fileName}:`, err);
    return null;
  }
};

/**
 * Load document from file path based on extension
 */
const loadDocumentFromFile = async (filePath: string): Promise<Document[]> => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    let loader;

    if (ext === ".pdf") {
      loader = new PDFLoader(filePath);
    } else if (ext === ".docx") {
      loader = new DocxLoader(filePath);
    } else if (ext === ".txt") {
      loader = new TextLoader(filePath);
    } else {
      console.warn(`[Dropbox] Unsupported file type: ${ext}`);
      return [];
    }

    const docs = await loader.load();
    return docs;
  } catch (err) {
    console.error(`[Dropbox] Failed to load ${filePath}:`, err);
    return [];
  }
};

/**
 * Split documents into chunks
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
    return splitDocs;
  } catch (err) {
    console.error("[Dropbox] Failed to split documents:", err);
    return documents;
  }
};

/**
 * Load all documents from Dropbox folder
 */
const loadDocumentsFromDropbox = async (): Promise<Document[]> => {
  if (!DROPBOX_ENABLED) {
    console.log("[Dropbox] Dropbox integration is disabled");
    return [];
  }

  if (!DROPBOX_ACCESS_TOKEN) {
    console.warn("[Dropbox] Missing DROPBOX_ACCESS_TOKEN");
    return [];
  }

  try {
    // List files from Dropbox
    const files = await listFilesFromDropbox();

    if (files.length === 0) {
      console.log("[Dropbox] No files found in folder");
      return [];
    }

    // Download and load each file
    const allDocs: Document[] = [];

    for (const file of files) {
      // @ts-ignore - Dropbox SDK types
      const filePath = file.path_display || file.path_lower;
      const fileName = file.name;

      if (!filePath || !fileName) continue;

      const localPath = await downloadFileFromDropbox(filePath, fileName);

      if (!localPath) continue;

      const docs = await loadDocumentFromFile(localPath);

      // Add metadata
      const docsWithMetadata = docs.map((doc) => {
        return new Document({
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            doc_type: "dropbox_document",
            file_name: fileName,
            file_path: filePath,
            source: "dropbox",
          },
        });
      });

      allDocs.push(...docsWithMetadata);

      // Clean up temp file
      try {
        fs.unlinkSync(localPath);
      } catch (_err) {
        // Ignore cleanup errors
      }
    }

    console.log(
      `[Dropbox] Loaded ${allDocs.length} document chunks from ${files.length} files`
    );

    // Split into chunks
    const chunks = await splitDocuments(allDocs);

    return chunks;
  } catch (err) {
    console.error("[Dropbox] Failed to load documents:", err);
    return [];
  }
};

/**
 * Get all document chunks from Dropbox
 */
const getAllDropboxDocuments = async (): Promise<Document[]> => {
  try {
    const docs = await loadDocumentsFromDropbox();
    return docs;
  } catch (err) {
    console.error("[Dropbox] Failed to get documents:", err);
    return [];
  }
};

export { getAllDropboxDocuments, loadDocumentsFromDropbox, listFilesFromDropbox };

export default getAllDropboxDocuments;
