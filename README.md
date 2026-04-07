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

## 🚀 Getting Started (Zero-Terminal Workflow)

Jabari is designed to be managed entirely via the **Docker Desktop UI** after the initial setup.

### 1. Initial Setup (One-time only)
Run this once in your terminal to register the project with Docker Desktop:
```bash
docker-compose up -d --build
```

### 2. Daily Operation
1.  Open **Docker Desktop**.
2.  Go to the **"Containers"** tab.
3.  Find the **"Jabari"** group.
4.  Click the **▶️ Start** button to wake up the whole platform.

### 3. Access
*   **User Dashboard:** [http://localhost](http://localhost)
*   **Market Database Stats:** [http://localhost:8000/knowledge/stats](http://localhost:8000/knowledge/stats)

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
