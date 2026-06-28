import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const EMBEDDING_MODEL = "openai/text-embedding-3-large";
const CHAT_MODEL = "openai/gpt-4o-mini";

export async function rewriteQuery(userQuery) {
  const systemPrompt = `You are an AI assistant designed to optimize user queries for semantic search.
Your job is to fix any typos, grammatical errors, and slightly rephrase the query to make it clearer for vector database retrieval if necessary.
Output ONLY the corrected query. Do not add quotes, explanations, or conversational filler.`;

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    temperature: 0, // Low temperature for deterministic corrections
  });

  return response.choices[0].message.content.trim();
}

export async function generateEmbeddings(chunks) {
  const texts = chunks.map((chunk) => chunk.pageContent);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  const embeddings = response.data.map((item) => item.embedding);
  console.log(`Generated ${embeddings.length} embeddings.`);
  return embeddings;
}

export async function generateSingleEmbedding(text) {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: [text],
  });

  return response.data[0].embedding;
}

export async function generateAnswer(userQuery, relevantChunks) {
  const context = relevantChunks
    .map((chunk, i) => `Chunk ${i + 1}:\n${chunk.content}`)
    .join("\n\n");

  const systemPrompt = `You are an AI assistant that answers questions strictly based on the provided document context.

Rules:
- Only answer based on the context provided below.
- Do NOT use any outside knowledge or general training data.
- If the answer is not found in the context, respond exactly with: "I could not find this information in the uploaded document."
- Be concise and accurate.
- Format your answer in clean Markdown.

Context from document:
${context}`;

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
  });

  return response.choices[0].message.content;
}

export async function generateAnswerStream(userQuery, relevantChunks) {
  const context = relevantChunks
    .map((chunk, i) => `Chunk ${i + 1}:\n${chunk.content}`)
    .join("\n\n");

  const systemPrompt = `You are an AI assistant that answers questions strictly based on the provided document context.

CRITICAL RULES:
- ABSOLUTE GROUNDING: You must ONLY answer using the context provided below.
- Do NOT use any outside knowledge, general training data, or external facts.
- Do NOT blend information. If there are conflicting terms in the history, rely entirely on the provided chunks below.
- If the answer cannot be confidently deduced from the context, respond exactly with: "I could not find this information in the uploaded document."
- Be concise, accurate, and format your answer in clean Markdown.

Context from document:
${context}`;

  const stream = await client.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
  });

  return stream;
}