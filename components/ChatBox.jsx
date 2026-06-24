"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import { ChevronDown, ChevronUp, Database, Clock, FileText, CheckCircle2, XCircle, Shield, Zap } from "lucide-react";

export default function ChatBox({ isReady, uploadedFile, documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [showChunks, setShowChunks] = useState(false);
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isThinking, showChunks]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isLoading || !isReady) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);
    setMetrics(null);
    setShowChunks(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentId, fileName: uploadedFile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get answer.");
      }

      setMessages((prev) => [...prev, { role: "ai", content: "" }]);
      setIsThinking(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isMetricsParsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (!isMetricsParsed) {
          const startMarker = "___METRICS___";
          const endMarker = "___END_METRICS___";
          const startIndex = buffer.indexOf(startMarker);
          const endIndex = buffer.indexOf(endMarker);

          if (startIndex !== -1 && endIndex !== -1) {
            const metricsJson = buffer.substring(startIndex + startMarker.length, endIndex);
            try {
              setMetrics(JSON.parse(metricsJson));
            } catch (e) {
              console.error("Failed to parse metrics", e);
            }
            
            buffer = buffer.substring(endIndex + endMarker.length);
            isMetricsParsed = true;
          }
        }

        if (isMetricsParsed && buffer.length > 0) {
          const textToAppend = buffer;
          buffer = "";
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + textToAppend,
              };
            }
            return updated;
          });
        }
      }

      if (buffer.length > 0) {
        const remaining = buffer;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "ai") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + remaining,
            };
          }
          return updated;
        });
      }
    } catch (error) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `❌ Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaChange(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Active Scope Bar */}
      <div className="glass-dark border-b border-white/[0.06] px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/60 truncate max-w-[300px] flex items-center gap-2">
              {uploadedFile}
              <span className="bg-emerald-500/10 text-emerald-400/80 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest border border-emerald-500/20">
                <Shield className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />Isolated
              </span>
            </p>
            <p className="text-[10px] text-white/20 mt-0.5 font-mono">{documentId}</p>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="px-5 py-3 border-b border-white/[0.04] bg-violet-500/[0.03] flex flex-col gap-3 shrink-0 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Retrieval Metric */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Database className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <span className="text-[9px] text-white/25 font-semibold uppercase tracking-widest block">Retrieval</span>
                  <span className="text-[11px] text-white/50 font-medium">
                    {metrics.retrieved} fetched → <span className={metrics.passed > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{metrics.passed} passed</span>
                  </span>
                </div>
              </div>
              
              <div className="w-px h-6 bg-white/[0.06]" />
              
              {/* Latency Metric */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-amber-400/80" />
                </div>
                <div>
                  <span className="text-[9px] text-white/25 font-semibold uppercase tracking-widest block">Latency</span>
                  <span className="text-[11px] text-white/50 font-medium font-mono">
                    {metrics.vectorLatency}ms <span className="text-white/15">vector</span> · {metrics.graderLatency}ms <span className="text-white/15">grader</span>
                  </span>
                </div>
              </div>
            </div>
            
            {metrics.chunks?.length > 0 && (
              <button 
                onClick={() => setShowChunks(!showChunks)}
                className="text-[10px] flex items-center gap-1.5 text-violet-400/70 hover:text-violet-300 font-medium transition-colors bg-violet-500/5 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/10 hover:border-violet-500/20"
              >
                Inspect Chunks
                {showChunks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Expandable Source Chunks */}
          {showChunks && metrics.chunks?.length > 0 && (
            <div className="mt-1 flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {metrics.chunks.map((c, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs ${
                  c.grade === "RELEVANT" 
                    ? "bg-emerald-500/[0.03] border-emerald-500/10" 
                    : "bg-white/[0.01] border-white/[0.04] opacity-50"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white/30 text-[10px]">Chunk {i + 1}</span>
                    {c.grade === "RELEVANT" ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-500/15">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Relevant
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-white/25 bg-white/[0.03] px-2 py-0.5 rounded-md uppercase tracking-widest border border-white/[0.04]">
                        <XCircle className="w-2.5 h-2.5" /> Filtered
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 leading-relaxed font-mono text-[10px] line-clamp-3 hover:line-clamp-none transition-all">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-16">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-white/[0.06] flex items-center justify-center glow-violet">
              <svg className="w-7 h-7 text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-white/70 tracking-tight">
                Ready for questions
              </p>
              <p className="text-sm text-white/25 mt-2 max-w-sm mx-auto leading-relaxed">
                Ask anything about your document. CRAG validates context chunks before generating answers.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-3 max-w-lg">
              {[
                "Summarize the key points",
                "What is the main topic?",
                "List all facts mentioned",
                "Explain the core concepts",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-[11px] bg-white/[0.03] hover:bg-violet-500/10 text-white/30 hover:text-violet-300 border border-white/[0.06] hover:border-violet-500/20 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}

        {/* Thinking bubble */}
        {isThinking && (
          <div className="flex justify-start mb-6 w-full animate-fade-in-up">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold mr-3 mt-1 shrink-0 shadow-lg shadow-violet-500/20">
              AI
            </div>
            <div className="glass border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2.5">
              <span className="text-xs font-medium text-white/30 mr-1">Analyzing & Grading</span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/[0.06] px-5 py-4 glass-dark shrink-0">
        <div className="flex items-end gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 focus-within:border-violet-500/30 focus-within:glow-violet transition-all duration-300">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={!isReady || isLoading}
            placeholder="Ask a grounded question..."
            className="flex-1 resize-none bg-transparent text-sm text-white/80 placeholder-white/20 focus:outline-none disabled:opacity-50 py-1 max-h-40 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!isReady || isLoading || !input.trim()}
            className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/15 text-white rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5 shadow-lg shadow-violet-500/20 disabled:shadow-none hover:shadow-violet-500/30"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-px">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/15 mt-2 text-center font-medium tracking-wide">
          CRAG Pipeline · Grounded Responses Only
        </p>
      </div>
    </div>
  );
}