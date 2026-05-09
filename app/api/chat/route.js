import { generateSingleEmbedding, generateAnswerStream } from "@/lib/openai.js";
import { retrieveRelevantChunks } from "@/lib/qdrant.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No question provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Embed the user query
    const queryEmbedding = await generateSingleEmbedding(question.trim());

    // Step 2: Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 5);

    if (!relevantChunks || relevantChunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "I could not find this information in the uploaded document.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Get the stream from OpenAI
    const stream = await generateAnswerStream(question.trim(), relevantChunks);

    // Step 4: Return a ReadableStream to the frontend
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}