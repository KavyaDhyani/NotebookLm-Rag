"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

export default function UploadBox({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [loadingText, setLoadingText] = useState("Parsing PDF...");

  async function handleFile(file) {
    if (!file) return;

    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.type)) {
      toast.error("Invalid file type", { description: "Only PDF or TXT files are supported." });
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setTimeout(() => setLoadingText("Generating Embeddings..."), 1500);
      setTimeout(() => setLoadingText("Indexing Vector Space..."), 3000);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      toast.success("Document Indexed", { description: data.message });
      onUploadSuccess(file.name, data.document_id);
    } catch (error) {
      toast.error("Upload Error", { description: error.message });
      setFileName(null);
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
    <div className="w-full flex flex-col gap-2">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center w-full h-28 border border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-violet-400/50 bg-violet-500/10 scale-[1.02] glow-violet"
            : "border-white/[0.08] bg-white/[0.02] hover:border-violet-400/30 hover:bg-violet-500/5"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="flex flex-col items-center gap-2.5 text-center px-4">
          {isUploading ? (
            <>
              <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              <div>
                <p className="text-xs font-semibold text-white/60">Processing...</p>
                <p className="text-[10px] text-violet-400/70 mt-0.5 font-medium animate-pulse">
                  {loadingText}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-violet-500/20" : "bg-white/[0.04]"
              }`}>
                <UploadCloud className={`w-5 h-5 ${isDragging ? "text-violet-400" : "text-white/25"}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/40">
                  Drop file or{" "}
                  <span className="text-violet-400/80 font-semibold underline underline-offset-2 decoration-violet-400/30">
                    browse
                  </span>
                </p>
                <p className="text-[10px] text-white/20 mt-0.5">PDF · TXT</p>
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

      {fileName && !isUploading && (
        <div className="flex items-center justify-center gap-1.5">
          <FileText className="w-3 h-3 text-violet-400/40" />
          <p className="text-[10px] text-white/30 font-medium truncate">{fileName}</p>
        </div>
      )}
    </div>
  );
}