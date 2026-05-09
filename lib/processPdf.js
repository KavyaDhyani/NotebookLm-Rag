import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import pdfParse from "pdf-parse";

export async function processDocument(buffer, mimeType) {
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

  // Chunk the text using RecursiveCharacterTextSplitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([text]);

  console.log(`Document split into ${chunks.length} chunks.`);

  return chunks;
}