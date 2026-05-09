# NotebookLM — RAG Document Assistant

A RAG-powered document assistant built with Next.js. Upload any PDF or TXT file and have a conversation with it. Answers are grounded strictly in the uploaded document.

Built as Assignment 03 for the AI/ML course.

---

## What It Does

1. User uploads a PDF or TXT file
2. The document is parsed, chunked, and embedded
3. Embeddings are stored in a Qdrant vector database
4. User asks questions in a chat interface
5. The system retrieves the most relevant chunks
6. The LLM answers strictly from the retrieved context — no hallucination

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript |
| Styling | Tailwind CSS |
| LLM & Embeddings | GitHub Models (OpenAI via GitHub inference) |
| Vector Database | Qdrant Cloud |
| PDF Parsing | pdf-parse |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| Markdown Rendering | react-markdown |

---

## RAG Pipeline

```
Upload → Parse → Chunk → Embed → Store in Qdrant
                                        ↓
Question → Embed Query → Retrieve Chunks → Generate Grounded Answer
```

- **Chunking:** RecursiveCharacterTextSplitter with `chunkSize: 1000` and `chunkOverlap: 200`
- **Embedding model:** `openai/text-embedding-3-large` (3072 dimensions)
- **LLM:** `openai/gpt-4.1-mini` via GitHub Models
- **Retrieval:** Top 5 most similar chunks by cosine similarity
- **Grounding:** Model is strictly instructed to answer only from retrieved context

---

## Folder Structure

```
app/
  api/
    upload/route.js       # Handles file upload and ingestion
    chat/route.js         # Handles question answering with streaming
  page.js                 # Main page
  layout.js               # Root layout
  globals.css             # Global styles

components/
  UploadBox.jsx           # File upload UI with drag and drop
  ChatBox.jsx             # Chat interface with streaming support
  MessageBubble.jsx       # Individual message bubble with markdown

lib/
  processPdf.js           # PDF parsing and chunking
  openai.js               # Embeddings and LLM calls
  qdrant.js               # Qdrant vector store operations
  rag.js                  # Orchestrates the full RAG pipeline
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
npm install
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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

1. Open the app in your browser
2. Upload a PDF or TXT file using the upload area
3. Wait for the document to be indexed (you'll see a chunk count on success)
4. Ask any question about the document in the chat
5. The AI will answer strictly from the document content

---

## API Routes

### `POST /api/upload`

Accepts a `multipart/form-data` request with a `file` field.

- Parses the document
- Chunks it using RecursiveCharacterTextSplitter
- Generates embeddings via GitHub Models
- Stores embeddings in Qdrant

**Response:**
```json
{
  "success": true,
  "message": "Document processed successfully. 42 chunks indexed.",
  "totalChunks": 42
}
```

### `POST /api/chat`

Accepts a JSON body with a `question` field. Returns a streamed plain text response.

**Request:**
```json
{
  "question": "What is this document about?"
}
```

**Response:** Streamed `text/plain` tokens

---

