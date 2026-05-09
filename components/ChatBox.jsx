"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ isReady, uploadedFile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isThinking]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isLoading || !isReady) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get answer.");
      }

      // Add empty AI message that we'll fill token by token
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);
      setIsThinking(false);

      // Read the stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const token = decoder.decode(value, { stream: true });

        // Append token to the last AI message
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "ai") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + token,
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
    <div className="w-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Uploaded File Card */}
      {uploadedFile && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-base shrink-0">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {uploadedFile}
            </p>
            <p className="text-xs text-green-600 font-medium">
              ✓ Indexed and ready
            </p>
          </div>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
            Active
          </span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 min-h-[560px] max-h-[680px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Ready to answer your questions
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ask anything about{" "}
                <span className="font-medium text-gray-500">
                  {uploadedFile || "your document"}
                </span>
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "Summarize this document",
                "What are the key points?",
                "What is this document about?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-colors"
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

        {/* Thinking bubble — shows before first token arrives */}
        {isThinking && (
          <div className="flex justify-start mb-5">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold mr-2.5 mt-1 shrink-0 shadow-sm">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="text-xs text-gray-400 mr-1">Thinking</span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={!isReady || isLoading}
            placeholder={
              isReady
                ? "Ask a question about your document..."
                : "Upload a document first..."
            }
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 py-1 max-h-40"
          />
          <button
            onClick={handleSend}
            disabled={!isReady || isLoading || !input.trim()}
            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 mb-0.5"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}