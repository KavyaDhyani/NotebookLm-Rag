import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const GRADER_MODEL = "openai/gpt-4o-mini";

export async function gradeChunks(userQuery, chunks) {
  const gradedChunks = [];
  
  // Grade chunks concurrently
  const promises = chunks.map(async (chunk) => {
    const prompt = `You are a relevance grader. You must determine if the following document chunk contains information relevant to answering the user's question.

Question: ${userQuery}

Chunk:
${chunk.content}

Output ONLY the word "RELEVANT" if the chunk is relevant, or "IRRELEVANT" if it is not. Do not include any other text.`;

    try {
      const response = await client.chat.completions.create({
        model: GRADER_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const grade = response.choices[0].message.content.trim().toUpperCase();
      
      const isRelevant = grade.includes("RELEVANT") && !grade.includes("IRRELEVANT");
      
      return {
        ...chunk,
        grade: isRelevant ? "RELEVANT" : "IRRELEVANT",
      };
    } catch (error) {
      console.error("Error grading chunk:", error);
      // Fallback to relevant if error occurs to avoid losing context entirely
      return { ...chunk, grade: "RELEVANT" };
    }
  });

  const results = await Promise.all(promises);
  return results;
}
