import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse";
import crypto from "crypto";

export async function processDocument(buffer, mimeType, fileName) {
  let text = "";

  if (mimeType === "application/pdf") {
    // Parse PDF buffer into raw text
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (mimeType === "text/plain") {
    // Plain text — just decode the buffer
    text = buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Could not extract any text from the document.");
  }

  // Generate a unique document ID
  const timestamp = Date.now().toString();
  const hash = crypto.createHash("sha256").update(`${fileName}-${timestamp}`).digest("hex").substring(0, 16);
  const document_id = `doc_${hash}`;

  // Chunk the text using RecursiveCharacterTextSplitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const rawChunks = await splitter.createDocuments([text]);

  // Inject strict metadata payload
  const chunks = rawChunks.map((chunk) => ({
    pageContent: chunk.pageContent,
    metadata: {
      ...chunk.metadata,
      document_id,
      file_name: fileName,
    },
  }));

  console.log(`Document split into ${chunks.length} chunks. Document ID: ${document_id}`);

  return { chunks, document_id };
}