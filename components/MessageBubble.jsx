import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-5`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold mr-2.5 mt-1 shrink-0 shadow-sm">
          AI
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm"
            : "bg-white text-gray-800 rounded-tl-sm border border-gray-200 shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-gray-800">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-4 mb-2 text-gray-800">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-4 mb-2 text-gray-800">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="mb-0.5">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700">{children}</em>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                      {children}
                    </code>
                  ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 rounded-lg p-3 mb-2 overflow-x-auto border border-gray-200">
                    {children}
                  </pre>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold text-gray-900 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-gray-900 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {children}
                  </h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-indigo-300 pl-3 italic text-gray-600 my-2">
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
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold ml-2.5 mt-1 shrink-0 shadow-sm">
          You
        </div>
      )}
    </div>
  );
}