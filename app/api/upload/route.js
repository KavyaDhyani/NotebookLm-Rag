import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag.js";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const mimeType = file.type;

    if (mimeType !== "application/pdf" && mimeType !== "text/plain") {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run the full ingestion pipeline
    const result = await ingestDocument(buffer, mimeType);

    return NextResponse.json({
      success: true,
      message: `Document processed successfully. ${result.totalChunks} chunks indexed.`,
      totalChunks: result.totalChunks,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong during upload." },
      { status: 500 }
    );
  }
}