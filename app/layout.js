import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NotebookLM — Corrective RAG",
  description: "Upload documents and chat with them using Corrective RAG with real-time explainability metrics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a14] text-gray-100 min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 40, 0.9)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              color: '#e2e8f0',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}