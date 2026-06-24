import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "notebooklm-rag";

// Dimension for text-embedding-3-large is 3072
const VECTOR_SIZE = 3072;

export async function ensureCollection() {
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`Collection "${COLLECTION_NAME}" created.`);
    } else {
      console.log(`Collection "${COLLECTION_NAME}" already exists.`);
    }

    // Ensure payload indexing is explicitly enabled for document_id
    try {
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.document_id",
        field_schema: "keyword",
      });
      console.log(`Payload index for 'metadata.document_id' ensured.`);
    } catch (indexError) {
      // Ignored: might already exist or other harmless error
    }
  } catch (error) {
    console.error("Error ensuring collection:", error);
    throw error;
  }
}

export async function storeEmbeddings(chunks, embeddings) {
  // chunks: array of { pageContent, metadata }
  // embeddings: array of number[] (one per chunk)

  const points = chunks.map((chunk, i) => ({
    id: Date.now() + i, // simple unique id
    vector: embeddings[i],
    payload: {
      content: chunk.pageContent,
      metadata: chunk.metadata,
    },
  }));

  await client.upsert(COLLECTION_NAME, {
    points,
  });

  console.log(`Stored ${points.length} chunks in Qdrant.`);
}

export async function retrieveRelevantChunks(queryEmbedding, targetDocumentId, topK = 5) {
  const filter = targetDocumentId
    ? {
        must: [{ key: "metadata.document_id", match: { value: targetDocumentId } }],
      }
    : undefined;

  const results = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    filter,
    limit: topK,
    with_payload: true,
  });

  return results.map((r) => ({
    content: r.payload.content,
    metadata: r.payload.metadata,
    score: r.score,
  }));
}