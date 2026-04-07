# Jabari AI 🦁
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

---

## 🛠 Tech Stack

*   **Backend:** FastAPI (Python 3.11)
*   **Frontend:** React + Vite (Vanilla CSS for premium styling)
*   **Databases:** 
    *   PostgreSQL + pgvector (Structured tender records & embeddings)
    *   ChromaDB (Local vector vault for document chunks)
*   **AI:** Groq (Llama-3 models), HuggingFace Transformers

---

## 📦 Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Groq API Key

### Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Thee-Unruly/Jabari.git
    cd Jabari
    ```

2.  **Configure Environment:**
    Create a `backend/.env` file:
    ```env
    GROQ_API_KEY=your_key_here
    DATABASE_URL=postgresql://postgres:postgres@db:5432/jabari
    ```

3.  **Launch:**
    ```bash
    docker-compose up --build
    ```

4.  **Initialize Knowledge:**
    Head to the **Knowledge Hub** in the UI and click the **Sync** icon to download the latest Kenya OCDS archives.

---

## 📜 Project Structure

```text
Jabari/
├── backend/            # FastAPI Service
│   ├── app/
│   │   ├── services/   # RAG, OCDS Ingestion, Assistant logic
│   │   └── main.py     # API Endpoints
│   └── requirements.txt
├── frontend/           # React Application
│   ├── src/
│   │   ├── components/ # KnowledgeHub, Vault, Chat
│   │   └── App.jsx
│   └── index.html
└── docker-compose.yml  # Orchestration
```

---
*Built for precision bidding.*
