# NotebookLM — Corrective RAG (CRAG)

An advanced RAG-powered document assistant built with Next.js. Upload any PDF or TXT file and have a conversation with it. This system implements **Corrective RAG (CRAG)** to completely eliminate hallucination by grading context chunks for relevance *before* they reach the generation model, ensuring answers are strictly grounded in your document.

Built with a premium dark-mode glassmorphic UI, real-time explainability metrics, and local document history persistence.

---

## What It Does & CRAG Pipeline

1. **Ingestion:** User uploads a PDF/TXT. The file is parsed, chunked, embedded via GitHub Models (`text-embedding-3-large`), and securely isolated in a Qdrant vector database using a unique `document_id`.
2. **Vector Search:** When you ask a question, the system retrieves the Top-K most similar chunks from your *isolated document scope*.
3. **Semantic Grading (Corrective Step):** A secondary LLM evaluator analyzes each retrieved chunk against your question, strictly classifying them as `RELEVANT` or `IRRELEVANT`. 
4. **Explainability & Metrics:** The backend measures latency for both vector retrieval and semantic grading, and streams these metrics to the frontend UI alongside the raw source chunks and their grading badges.
5. **Grounded Generation:** Only the `RELEVANT` chunks are passed to the final generation model (`gpt-4o-mini`). If 0 chunks pass, the system executes a safe fallback rather than hallucinating.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` |
| UI/UX | Premium Dark Mode, Glassmorphism, `sonner` Toasts |
| LLM & Embeddings | GitHub Models Inference API (`gpt-4o-mini` & `text-embedding-3-large`) |
| Vector Database | Qdrant Cloud |
| PDF Parsing | pdf-parse |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| Markdown Rendering | react-markdown |

---

## Features

- **Document Isolation:** Qdrant payload filters ensure that queries can never leak into other uploaded documents.
- **Explainability Dashboard:** See exactly how many chunks were fetched, how many passed the semantic grader, and inspect the raw text of the chunks to verify why the AI answered the way it did.
- **Persistent History:** Your uploaded documents are remembered via browser `localStorage`. Refresh the page and your documents are instantly ready in the sidebar without needing re-uploading.
- **Telemetry Streaming:** Pipeline metrics are injected directly into the HTTP stream, ensuring the dashboard renders before the LLM even begins streaming its text.

---

## Folder Structure

```
app/
  api/
    upload/route.js       # Handles file upload, embedding, and Qdrant ingestion
    chat/route.js         # CRAG Pipeline: Retrieval -> Grading -> Stream Generation
  page.js                 # Main split-pane layout and localStorage hydration
  layout.js               # Root layout, Next/Font config, Toaster
  globals.css             # Global dark theme CSS and micro-animations

components/
  UploadBox.jsx           # Drag-and-drop upload zone with loading telemetry
  ChatBox.jsx             # Chat interface, Stream parser, and Metrics Dashboard
  MessageBubble.jsx       # Individual message rendering with @tailwindcss/typography

lib/
  processPdf.js           # PDF parsing and metadata chunking
  evaluator.js            # Semantic Grader LLM logic
  openai.js               # Embeddings and chat completions (GitHub Models)
  qdrant.js               # Qdrant vector store operations and payload filtering
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/notebooklm-rag.git
cd notebooklm-rag
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```env
GITHUB_TOKEN=your_github_token_here
QDRANT_URL=your_qdrant_cloud_url_here
QDRANT_API_KEY=your_qdrant_cloud_api_key_here
QDRANT_COLLECTION_NAME=notebooklm-rag
```

| Variable | Where to get it |
|---|---|
| `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) — needs `models:read` permission |
| `QDRANT_URL` | Your cluster endpoint from [cloud.qdrant.io](https://cloud.qdrant.io) |
| `QDRANT_API_KEY` | Your API key from the Qdrant Cloud dashboard |
| `QDRANT_COLLECTION_NAME` | Leave as `notebooklm-rag` — created automatically |

### 4. Run the development server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Routes Overview

### `POST /api/upload`
Accepts a `multipart/form-data` request with a `file` field. Parses the document, generates a unique `document_id`, chunks it, and pushes vectors to Qdrant. Returns the generated `document_id` and `file_name` for client-side state management.

### `POST /api/chat`
Accepts `{"question": "...", "documentId": "...", "fileName": "..."}`.
Executes the CRAG pipeline:
1. Embeds query.
2. Filters Qdrant by `documentId`.
3. Calls `evaluator.js` to grade chunks.
4. Returns a `text/plain` stream. The first chunk of the stream contains a specialized `___METRICS___{...}___END_METRICS___` JSON string, followed immediately by the LLM markdown response tokens.
