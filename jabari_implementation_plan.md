# Jabari AI: Implementation Plan

Jabari AI is a specialized Bid Intelligence Platform designed to empower procurement teams and contractors in Kenya. This plan outlines the transition from a conceptual landing page to a fully functional AI-driven application.

## 1. Project Overview
Jabari AI will automate the end-to-end bidding process:
- **Analyze** complex tender documents (RFPs, BOQs, Specs).
- **Match** tenders against firm profiles (NCA, AGPO, Financials).
- **Draft** high-quality, compliant proposals.
- **Search** institutional knowledge (PPRA, KeBS, County rules).

## 2. Technical Stack (Proposed)
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React / Next.js (Modern, responsive UI) |
| **Backend** | Python (FastAPI) or Node.js (for AI orchestration) |
| **Database** | PostgreSQL (Relational) + Pinecone/Qdrant (Vector DB) |
| **AI/LLM** | OpenRouter (Claude 3.5 Sonnet / GPT-4o) |
| **Document Processing** | PyMuPDF, Unstructured.io, OCR (Tesseract/Azure Form Recognizer) |
| **Integrations** | WhatsApp API (Twilio), Office 365 / Google Workspace SDKs |

## 3. Implementation Phases

### Phase 1: The Vault (Foundation)
*Focus: Secure document storage and intelligence.*
- [ ] **Document Ingestion**: Multi-format upload (PDF, DOCX, XLSX).
- [ ] **OCR & Parsing**: Extract text from scanned BOQs and technical drawings.
- [ ] **Auto-Tagging**: Metadata extraction (Tender ID, Due Date, NCA Category, Value).
- [ ] **Risk Flagging**: Automated identification of "Liquidated Damages" or "JV" clauses.

### Phase 2: Jabari Assistant (The Core)
*Focus: Conversational Intelligence grounded in the Vault.*
- [ ] **RAG (Retrieval-Augmented Generation)**: Grounding LLM responses in Vault documents.
- [ ] **Source Citations**: Ensure every answer links back to a specific page/clause (No Hallucinations).
- [ ] **Drafting Engine**: Generate technical proposals and cover letters using firm-specific templates.

### Phase 3: Knowledge Base (The Library)
*Focus: Institutional grounding in Kenyan law.*
- [ ] **Regulation Ingestion**: Scrape/index PPRA portal, AGPO guidelines, and KeBS standards.
- [ ] **Cross-Jurisdictional Search**: Unified access to all 47 county tender portals.
- [ ] **Pricing Benchmarks**: Historical tender data analysis for competitive bidding strategy.

### Phase 4: Workflow Agents (Automation)
*Focus: Autopilot for bid managers.*
- [ ] **Tender Screening Agent**: Daily filtering of PPRA tenders vs. firm profile.
- [ ] **Compliance Agent**: Automated gap analysis (e.g., "Your NCA cert is Cat 5, but Cat 6 is required").
- [ ] **Deadline Manager**: Integration with calendars for submission alerts.

### Phase 5: Ecosystem (The Reach)
*Focus: Working where the user is.*
- [ ] **WhatsApp Bot**: Query Vault and get tender alerts on the go.
- [ ] **Word/Outlook Add-ins**: Side-panel for drafting/summarizing without leaving Office.

## 4. Immediate Next Steps
1. **Initialize Project**: Set up the repository structure (Monorepo with Frontend/Backend).
2. **Prototype Ingestion**: Build a script to parse a sample KERRA road tender RFP.
3. **Core API**: Set up the FastAPI shell with basic RAG capabilities.
