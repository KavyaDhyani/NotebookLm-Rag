"use client";

import { useState } from "react";

export default function UploadBox({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fileName, setFileName] = useState(null);

  async function handleFile(file) {
    if (!file) return;

    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.type)) {
      setStatus({ type: "error", message: "Only PDF or TXT files are supported." });
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setStatus({ type: "success", message: data.message });
      onUploadSuccess(file.name);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(e) {
    const file = e.target.files[0];
    handleFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Drop Zone */}
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
            : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          {isUploading ? (
            <>
              <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Processing document...
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Chunking and indexing your file
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                📄
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop your file here
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  or{" "}
                  <span className="text-indigo-600 font-medium underline underline-offset-2">
                    browse to upload
                  </span>{" "}
                  · PDF or TXT
                </p>
              </div>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleInputChange}
          disabled={isUploading}
        />
      </label>

      {/* Status Message */}
      {status && (
        <div
          className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {status.type === "success" ? "✅" : "❌"}
          </span>
          <span>{status.message}</span>
        </div>
      )}

      {/* Selected file name */}
      {fileName && !isUploading && (
        <p className="text-xs text-gray-400 text-center">
          Selected:{" "}
          <span className="font-medium text-gray-500">{fileName}</span>
        </p>
      )}
    </div>
  );
}