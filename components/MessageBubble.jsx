import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-5 animate-fade-in-up`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold mr-3 mt-1 shrink-0 shadow-lg shadow-violet-500/20">
          AI
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-violet-500/15"
            : "glass border border-white/[0.06] text-white/80 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-white/75">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-4 mb-2 text-white/75">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-4 mb-2 text-white/75">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="mb-0.5 text-white/70">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-violet-300">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-white/60">{children}</em>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono border border-violet-500/15">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-black/30 text-white/70 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-white/[0.04]">
                      {children}
                    </code>
                  ),
                pre: ({ children }) => (
                  <pre className="bg-black/30 rounded-xl p-3 mb-2 overflow-x-auto border border-white/[0.04]">
                    {children}
                  </pre>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold text-white/90 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-white/85 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-white/80 mb-1">
                    {children}
                  </h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-violet-500/30 pl-3 italic text-white/40 my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 text-[10px] font-bold ml-3 mt-1 shrink-0">
          You
        </div>
      )}
    </div>
  );
}