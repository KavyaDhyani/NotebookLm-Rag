import { processDocument } from "./processPdf.js";
import { generateEmbeddings, generateSingleEmbedding, generateAnswer } from "./openai.js";
import { ensureCollection, storeEmbeddings, retrieveRelevantChunks } from "./qdrant.js";

export async function ingestDocument(buffer, mimeType) {

  // Parse and chunk the document
  const chunks = await processDocument(buffer, mimeType);

  // Ensure Qdrant collection exists
  await ensureCollection();

  // Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(chunks);

  // Store chunks + embeddings in Qdrant
  await storeEmbeddings(chunks, embeddings);

  return {
    success: true,
    totalChunks: chunks.length,
  };
}

export async function queryDocument(userQuery) {
  // Embed the user's question
  const queryEmbedding = await generateSingleEmbedding(userQuery);

  // Retrieve the most relevant chunks from Qdrant
  const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 5);

  if (!relevantChunks || relevantChunks.length === 0) {
    return "I could not find this information in the uploaded document.";
  }

  // Generate a grounded answer using the retrieved chunks
  const answer = await generateAnswer(userQuery, relevantChunks);

  return answer;
}