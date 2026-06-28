import { generateSingleEmbedding, generateAnswerStream, rewriteQuery } from "@/lib/openai.js";
import { retrieveRelevantChunks } from "@/lib/qdrant.js";
import { gradeChunks } from "@/lib/evaluator.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, documentId, fileName } = body;

    if (!question || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No question provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Rewrite and Embed the user query
    const startVector = Date.now();
    const originalQuery = question.trim();
    
    // Correct typos and rephrase for better semantic search
    const rewrittenQuery = await rewriteQuery(originalQuery);
    console.log(`[CRAG] Original: "${originalQuery}" | Rewritten: "${rewrittenQuery}"`);

    const queryEmbedding = await generateSingleEmbedding(rewrittenQuery);

    // Step 2: Retrieve relevant chunks
    console.log(`[CRAG] Querying Qdrant for DocumentId: ${documentId}`);
    const retrievedChunks = await retrieveRelevantChunks(queryEmbedding, documentId, 5);
    const vectorLatency = Date.now() - startVector;
    console.log(`[CRAG] Retrieved ${retrievedChunks?.length || 0} chunks in ${vectorLatency}ms`);

    if (!retrievedChunks || retrievedChunks.length === 0) {
      // Return early with fallback
      const fallbackMetrics = {
        retrieved: 0,
        passed: 0,
        vectorLatency,
        graderLatency: 0,
        fileName: fileName || "Unknown",
        originalQuery,
        rewrittenQuery,
        chunks: [],
      };
      return createStreamResponse("I could not find this information in the uploaded document.", fallbackMetrics);
    }

    // Step 3: Grade the chunks (CRAG)
    const startGrader = Date.now();
    const gradedChunks = await gradeChunks(rewrittenQuery, retrievedChunks);
    const graderLatency = Date.now() - startGrader;

    const passedChunks = gradedChunks.filter(c => c.grade === "RELEVANT");
    
    const metrics = {
      retrieved: retrievedChunks.length,
      passed: passedChunks.length,
      vectorLatency,
      graderLatency,
      fileName: fileName || "Unknown",
      originalQuery,
      rewrittenQuery,
      chunks: gradedChunks.map(c => ({ content: c.content, grade: c.grade }))
    };

    if (passedChunks.length === 0) {
      // Fallback mechanism
      return createStreamResponse("The uploaded document does not contain relevant information to answer this question. Please try rephrasing or ask about another topic.", metrics);
    }

    // Step 4: Get the stream from OpenAI
    const stream = await generateAnswerStream(rewrittenQuery, passedChunks);

    // Return ReadableStream with metrics prefixed
    return createOpenAIStreamResponse(stream, metrics);
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function createStreamResponse(text, metrics) {
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    start(controller) {
      const metricsPayload = `___METRICS___${JSON.stringify(metrics)}___END_METRICS___`;
      controller.enqueue(encoder.encode(metricsPayload));
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function createOpenAIStreamResponse(stream, metrics) {
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      const metricsPayload = `___METRICS___${JSON.stringify(metrics)}___END_METRICS___`;
      controller.enqueue(encoder.encode(metricsPayload));

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
}