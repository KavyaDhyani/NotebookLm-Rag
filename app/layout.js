import "./globals.css";

export const metadata = {
  title: "NotebookLM — RAG Document Assistant",
  description: "Upload a document and chat with it using AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}