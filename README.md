# Jabari 🦁
**Unified Intelligence for Tender Management & Market Analytics**

Jabari is a dual-engine AI platform designed for high-stakes procurement. It combines private document intelligence (RAG) with public market records (OCDS) to provide grounded, competitive insights for the bidding process.

---

## 🚀 Core Engines

### 1. The Vault (Private Intelligence)
*   **Contextual RAG:** Upload your previous bids, technical proposals, and company profiles.
*   **Hybrid Extraction:** Advanced parsing of PDFs, Word docs, and even scanned images (OCR).
*   **Semantic Search:** Powered by `pgvector` and `sentence-transformers` for deep retrieval.

### 2. Knowledge Hub (Market Intelligence)
*   **Live OCDS Feed:** Integrated with Kenya's Open Contracting portal.
*   **Pricing Benchmarking:** Instantly search historical award values for specific items (e.g., "Laptops", "Civil Works") across 2018–2026.
*   **Multi-Format Ingestion:** Supports one-click sync from remote URLs or manual upload of JSONL, XLSX, and CSV files.

### 3. Jabari Assistant
*   **Grounded Reasoning:** Uses Groq-powered LLMs to answer queries based *only* on your verified data.
*   **Intelligence Blending:** Automatically calculates market averages from external data while referencing your internal technical strengths.

## 🚀 One-Click Launch (Recommended)

Since you are on Windows, you don't need to type commands every day:
1.  **Double-click `JabariLauncher.bat`** in the root folder.
2.  Press **[1]** to start Jabari in the background.
3.  Open your browser to: **[http://localhost](http://localhost)**

---

## 🛠 Tech Stack

*   **Backend:** FastAPI (Python 3.11)
*   **Frontend:** React + Vite (Vanilla CSS for premium styling)
*   **Databases:** 
    *   PostgreSQL + pgvector (Structured tender records & embeddings)
    *   ChromaDB (Local vector vault for document chunks)
*   **AI:** Groq (Llama-3 models), HuggingFace Transformers

---

*Built for precision bidding.*
