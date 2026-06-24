"use client";

import { useState, useEffect } from "react";
import UploadBox from "@/components/UploadBox";
import ChatBox from "@/components/ChatBox";
import { Clock, FileText, Sparkles, Trash2 } from "lucide-react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("notebooklm_docs");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDocuments(parsed);
          setActiveDocument(parsed[0]);
        }
      } catch (e) {
        console.error("Failed to parse docs from localStorage", e);
      }
    }
  }, []);

  function handleUploadSuccess(fileName, newDocumentId) {
    const newDoc = { fileName, documentId: newDocumentId, date: new Date().toISOString() };
    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    setActiveDocument(newDoc);
    localStorage.setItem("notebooklm_docs", JSON.stringify(updatedDocs));
  }

  if (!isClient) return null;

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a14]">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass-dark border-b border-white/[0.06] px-6 py-3.5 flex items-center gap-3 sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight tracking-tight">
                NotebookLM
              </h1>
              <p className="text-[11px] text-violet-400/70 font-medium">Corrective RAG Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              System Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-white/[0.06] glass-dark flex flex-col h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
          <div className="p-4 flex flex-col gap-5">
            {/* Upload Section */}
            <div>
              <h2 className="text-[11px] font-semibold text-violet-300/60 mb-3 uppercase tracking-widest flex items-center gap-2">
                Upload
              </h2>
              <UploadBox onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Document History */}
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-semibold text-violet-300/60 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Documents
                </h2>
                {documents.length > 0 && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("notebooklm_docs");
                      setDocuments([]);
                      setActiveDocument(null);
                    }}
                    className="text-[10px] text-red-400/60 hover:text-red-400 font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/[0.06]">
                  <FileText className="w-6 h-6 text-white/10 mx-auto mb-2" />
                  <p className="text-[11px] text-white/20 font-medium">No documents yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {documents.map((doc) => (
                    <button
                      key={doc.documentId}
                      onClick={() => setActiveDocument(doc)}
                      className={`text-left p-2.5 rounded-xl transition-all duration-200 border flex items-center gap-2.5 group ${
                        activeDocument?.documentId === doc.documentId
                          ? "bg-violet-500/10 border-violet-500/20 glow-violet"
                          : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
                      }`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                        activeDocument?.documentId === doc.documentId 
                          ? "bg-violet-500/20 text-violet-400" 
                          : "bg-white/[0.03] text-white/20 group-hover:text-white/40"
                      }`}>
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          activeDocument?.documentId === doc.documentId ? "text-violet-200" : "text-white/50 group-hover:text-white/70"
                        }`}>
                          {doc.fileName}
                        </p>
                        <p className={`text-[9px] mt-0.5 truncate font-mono ${
                          activeDocument?.documentId === doc.documentId ? "text-violet-400/50" : "text-white/15"
                        }`}>
                          {doc.documentId}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content (Chat) */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {!activeDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-white/[0.06] flex items-center justify-center mb-6 glow-violet">
                <Sparkles className="w-8 h-8 text-violet-400/40" />
              </div>
              <h2 className="text-xl font-semibold text-white/80 tracking-tight">No Document Selected</h2>
              <p className="text-sm text-white/30 mt-3 leading-relaxed">
                Upload a PDF or TXT file from the sidebar, or select a previously uploaded document to start asking questions.
              </p>
            </div>
          ) : (
            <div className="w-full h-full">
              <ChatBox
                key={activeDocument.documentId} 
                isReady={true} 
                uploadedFile={activeDocument.fileName} 
                documentId={activeDocument.documentId} 
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}