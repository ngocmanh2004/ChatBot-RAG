import { google } from "googleapis";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const GOOGLE_DRIVE_FOLDER_ID = Bun.env.GOOGLE_DRIVE_FOLDER_ID || "";
const GOOGLE_DRIVE_ENABLED = Bun.env.GOOGLE_DRIVE_ENABLED === "true";
const CHUNK_SIZE = Number(Bun.env.CHUNK_SIZE || "1000");
const CHUNK_OVERLAP = Number(Bun.env.CHUNK_OVERLAP || "200");

// Google Drive credentials from service account
const GOOGLE_DRIVE_CREDENTIALS = Bun.env.GOOGLE_DRIVE_CREDENTIALS
  ? JSON.parse(Bun.env.GOOGLE_DRIVE_CREDENTIALS)
  : null;

/**
 * Initialize Google Drive API client
 */
const initDriveClient = () => {
  if (!GOOGLE_DRIVE_CREDENTIALS) {
    throw new Error("Missing GOOGLE_DRIVE_CREDENTIALS");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_DRIVE_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
};

/**
 * List all files in Google Drive folder
 */
const listFilesFromDrive = async () => {
  if (!GOOGLE_DRIVE_ENABLED || !GOOGLE_DRIVE_FOLDER_ID) {
    return [];
  }

  try {
    const drive = initDriveClient();

    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: "files(id, name, mimeType, size)",
      pageSize: 100,
    });

    const files = response.data.files || [];
    
    // Filter supported file types
    const supportedFiles = files.filter((file) => {
      const mimeType = file.mimeType || "";
      return (
        mimeType === "application/pdf" ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "text/plain"
      );
    });

    console.log(`[GoogleDrive] Found ${supportedFiles.length} supported files`);
    return supportedFiles;
  } catch (err) {
    console.error("[GoogleDrive] Failed to list files:", err);
    return [];
  }
};

/**
 * Download file from Google Drive to temp folder
 */
const downloadFileFromDrive = async (
  fileId: string,
  fileName: string
): Promise<string | null> => {
  try {
    const drive = initDriveClient();

    const tempDir = path.join(os.tmpdir(), "rag-documents");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileName);

    const dest = fs.createWriteStream(filePath);

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    return new Promise((resolve, reject) => {
      response.data
        .on("end", () => {
          console.log(`[GoogleDrive] Downloaded: ${fileName}`);
          resolve(filePath);
        })
        .on("error", (err: Error) => {
          console.error(`[GoogleDrive] Download error: ${fileName}`, err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (err) {
    console.error(`[GoogleDrive] Failed to download ${fileName}:`, err);
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
      console.warn(`[GoogleDrive] Unsupported file type: ${ext}`);
      return [];
    }

    const docs = await loader.load();
    return docs;
  } catch (err) {
    console.error(`[GoogleDrive] Failed to load ${filePath}:`, err);
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
    console.error("[GoogleDrive] Failed to split documents:", err);
    return documents;
  }
};

/**
 * Load all documents from Google Drive folder
 */
const loadDocumentsFromGoogleDrive = async (): Promise<Document[]> => {
  if (!GOOGLE_DRIVE_ENABLED) {
    console.log("[GoogleDrive] Google Drive integration is disabled");
    return [];
  }

  if (!GOOGLE_DRIVE_FOLDER_ID) {
    console.warn("[GoogleDrive] Missing GOOGLE_DRIVE_FOLDER_ID");
    return [];
  }

  try {
    // List files from Drive
    const files = await listFilesFromDrive();

    if (files.length === 0) {
      console.log("[GoogleDrive] No files found in folder");
      return [];
    }

    // Download and load each file
    const allDocs: Document[] = [];

    for (const file of files) {
      if (!file.id || !file.name) continue;

      const filePath = await downloadFileFromDrive(file.id, file.name);
      
      if (!filePath) continue;

      const docs = await loadDocumentFromFile(filePath);

      // Add metadata
      const docsWithMetadata = docs.map((doc) => {
        return new Document({
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            doc_type: "google_drive_document",
            file_name: file.name,
            file_id: file.id,
            source: "google_drive",
            mime_type: file.mimeType,
          },
        });
      });

      allDocs.push(...docsWithMetadata);

      // Clean up temp file
      try {
        fs.unlinkSync(filePath);
      } catch (_err) {
        // Ignore cleanup errors
      }
    }

    console.log(`[GoogleDrive] Loaded ${allDocs.length} document chunks from ${files.length} files`);

    // Split into chunks
    const chunks = await splitDocuments(allDocs);

    return chunks;
  } catch (err) {
    console.error("[GoogleDrive] Failed to load documents:", err);
    return [];
  }
};

/**
 * Get all document chunks from Google Drive
 */
const getAllGoogleDriveDocuments = async (): Promise<Document[]> => {
  try {
    const docs = await loadDocumentsFromGoogleDrive();
    return docs;
  } catch (err) {
    console.error("[GoogleDrive] Failed to get documents:", err);
    return [];
  }
};

export {
  getAllGoogleDriveDocuments,
  loadDocumentsFromGoogleDrive,
  listFilesFromDrive,
};

export default getAllGoogleDriveDocuments;
