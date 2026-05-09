"use client";

import { useState } from "react";
import UploadBox from "@/components/UploadBox";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  function handleUploadSuccess(fileName) {
    setIsReady(true);
    setUploadedFile(fileName);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
          N
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            NotebookLM
          </h1>
          <p className="text-xs text-gray-400">RAG-powered document assistant</p>
        </div>
      </header>

      {/* Centered Content */}
      <div className="flex-1 flex flex-col items-center w-full px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Upload Section */}
          {!isReady && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">
                Upload a Document
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Upload a PDF or TXT file to get started. It will be indexed and
                ready to chat with instantly.
              </p>
              <UploadBox onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Chat Section */}
          {isReady && (
            <ChatBox isReady={isReady} uploadedFile={uploadedFile} />
          )}
        </div>
      </div>
    </main>
  );
}