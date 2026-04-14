from __future__ import annotations
import os
import shutil
from typing import Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.detector import DocumentDetector
from app.services.extractor import DocumentExtractor
from app.services.chunker import DocumentChunker
from app.services.analyzer import HybridAnalyzer
from app.services.vector_store import VectorStoreService
from app.services.assistant import JabariAssistant
from app.services.drafter import JabariDrafter
from app.services.exporter import ExportEngine
from app.services.knowledge import KnowledgeService
from app.db import SessionLocal, init_db, Document, DocumentChunk, Tender, ProcurementRecord
from fastapi.responses import StreamingResponse

# Initialize components
init_db()
assistant = JabariAssistant()
drafter = JabariDrafter()

app = FastAPI(title="Jabari AI - Phase 3 Deliverability")

class ChatRequest(BaseModel):
    message: str
    document_id: int | None = None
    tender_id: int | None = None

class TenderCreate(BaseModel):
    name: str
    description: str | None = None

class DraftRequest(BaseModel):
    document_id: int
    draft_type: str = "technical_proposal"

class ExportRequest(BaseModel):
    title: str
    content: str

# Dependency for DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configure CORS for the React/Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration: Storage folders
UPLOAD_DIR = os.path.abspath("data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory to serve original files
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

class DocumentChunkSchema(BaseModel):
    text: str
    section_hint: str
    metadata: dict[str, Any]

class IngestionResponse(BaseModel):
    file_name: str
    category: str
    needs_ocr: bool
    full_content: str
    chunks: list[DocumentChunkSchema]
    analysis: dict[str, Any]
    metadata: dict[str, Any]

@app.get("/tenders")
def list_tenders(db: Session = Depends(get_db)):
    """ List all grouped tender projects """
    tenders = db.query(Tender).order_by(Tender.created_at.desc()).all()
    return [{
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "document_count": len(t.documents)
    } for t in tenders]

@app.post("/tenders")
def create_tender(request: TenderCreate, db: Session = Depends(get_db)):
    """ Create a new grouped tender project """
    db_tender = Tender(name=request.name, description=request.description)
    db.add(db_tender)
    try:
        db.commit()
        db.refresh(db_tender)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tender name already exists or invalid.")
    return db_tender

@app.post("/chat")
async def chat_with_docs(request: ChatRequest, db: Session = Depends(get_db)):
    """ Phase 2: Intelligent Chat Endpoint """
    return assistant.ask(
        request.message, 
        db=db, 
        document_id=request.document_id,
        tender_id=request.tender_id
    )

@app.get("/sources", response_model=list[dict[str, Any]])
async def list_sources(db: Session = Depends(get_db)):
    """
    Fetches the entire library from the Perpetual Vault.
    """
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    # Map to frontend format
    return [
        {
            "id": d.id,
            "tender_id": d.tender_id,
            "file_name": d.filename,
            "category": d.category,
            "analysis": {
                "brief": d.summary,
                "status": d.status
            }
        } for d in docs
    ]

@app.post("/draft")
async def generate_draft(request: DraftRequest, db: Session = Depends(get_db)):
    """
    Drafting Endpoint: Synthesizes professional bidding artifacts.
    """
    return drafter.generate_draft(db, request.document_id, request.draft_type)

@app.post("/export/docx")
async def export_draft_docx(request: ExportRequest):
    """
    Export Engine: Binds AI drafts into formal Microsoft Word documents.
    """
    file_stream = ExportEngine.generate_docx(title=request.title, content=request.content)
    
    headers = {
        'Content-Disposition': f'attachment; filename="{request.title.replace(" ", "_")}.docx"'
    }
    
    return StreamingResponse(
        file_stream,
        headers=headers,
        media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

@app.get("/knowledge/search")
def search_benchmarks(q: str, db: Session = Depends(get_db)):
    """
    Jabari Knowledge: Market Intelligence Search.
    Finds historical tender awards and pricing benchmarks.
    """
    return KnowledgeService.get_benchmarks(q, db)

@app.get("/knowledge/stats")
def knowledge_stats(db: Session = Depends(get_db)):
    """Returns summary stats about the knowledge base."""
    return KnowledgeService.get_stats(db)

@app.post("/knowledge/sync")
async def sync_knowledge_base():
    """
    Live sync with the OCDS portal.
    Downloads the full data archive and updates the knowledge vault.
    """
    url = "https://data.open-contracting.org/en/publication/147/download?name=full.jsonl.gz"
    # Run in background in a real app, but for now we'll wait for the small 40MB file
    result = KnowledgeService.sync_ocds_from_url(url)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Sync failed"))
    
    return {
        "status": "success",
        "indexed": result.get("indexed", 0),
        "skipped": result.get("skipped", 0)
    }

@app.post("/knowledge/reset")
async def reset_knowledge_base():
    """Wipes all market records for a clean start."""
    result = KnowledgeService.clear_all()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return {"status": "success", "message": result.get("message")}

@app.post("/knowledge/vectorize")
async def vectorize_knowledge_base(background_tasks: BackgroundTasks):
    """
    Generates embeddings for all ProcurementRecords that are missing vectors.
    Run this once after a bulk sync to enable fast semantic search.
    """
    unembedded = KnowledgeService.count_unembedded()
    if unembedded == 0:
        return {"status": "ok", "message": "All records are already vectorized.", "pending": 0}
    background_tasks.add_task(KnowledgeService.vectorize_missing)
    return {"status": "started", "message": f"Vectorizing {unembedded} records in background.", "pending": unembedded}

@app.get("/knowledge/vectorize/status")
async def vectorize_status():
    """Returns the number of records still awaiting vectorization."""
    pending = KnowledgeService.count_unembedded()
    return {"pending": pending, "done": pending == 0}

@app.get("/knowledge/insights")
async def get_knowledge_insights(db: Session = Depends(get_db)):
    """Macro-level market data analytics."""
    return KnowledgeService.get_market_insights(db)

@app.get("/knowledge/stats")
async def get_knowledge_stats(db: Session = Depends(get_db)):
    """Fast record counting."""
    return KnowledgeService.get_stats(db)

@app.get("/knowledge/browse")
def browse_knowledge(
    page: int = 1,
    limit: int = 100,
    status: str = None,
    category: str = None,
    sort_by: str = "amount",
    sort_dir: str = "desc",
    db: Session = Depends(get_db)
):
    """Paginated, filterable browse of all procurement records for the table view."""
    from sqlalchemy import asc, desc, nullslast
    q = db.query(ProcurementRecord)
    if status:
        q = q.filter(ProcurementRecord.status.ilike(f"%{status}%"))
    if category:
        q = q.filter(ProcurementRecord.category.ilike(f"%{category}%"))
    col_map = {
        "amount": ProcurementRecord.amount,
        "date": ProcurementRecord.date_published,
        "title": ProcurementRecord.title,
        "buyer": ProcurementRecord.buyer_name,
    }
    col = col_map.get(sort_by, ProcurementRecord.amount)
    order = nullslast(desc(col)) if sort_dir != "asc" else nullslast(asc(col))
    q = q.order_by(order)
    total = q.count()
    records = q.offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "records": [
            {
                "id": r.id,
                "ocid": r.ocid,
                "title": r.title,
                "buyer": r.buyer_name,
                "amount": r.amount,
                "currency": r.currency or "KES",
                "status": r.status,
                "category": r.category,
                "location": r.location,
                "date": r.date_published.strftime("%d %b %Y") if r.date_published else None,
            }
            for r in records
        ],
    }

@app.get("/knowledge/facets")
def knowledge_facets(db: Session = Depends(get_db)):
    """Returns distinct status and category values for filter dropdowns."""
    from sqlalchemy import distinct
    statuses = [
        r[0] for r in db.query(distinct(ProcurementRecord.status))
        .filter(ProcurementRecord.status.isnot(None))
        .order_by(ProcurementRecord.status)
        .limit(30).all()
    ]
    categories = [
        r[0] for r in db.query(distinct(ProcurementRecord.category))
        .filter(ProcurementRecord.category.isnot(None))
        .order_by(ProcurementRecord.category)
        .limit(50).all()
    ]
    return {"statuses": statuses, "categories": categories}

@app.post("/knowledge/ingest")
async def ingest_knowledge_base(file: UploadFile = File(...)):
    """
    Direct ingestion of OCDS CSV or Excel dumps into the Knowledge Vault.
    Supports: .csv, .xlsx, .xls from Kenya's OCDS data portal.
    """
    file_path = os.path.join(UPLOAD_DIR, f"knowledge_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    result = KnowledgeService.ingest_ocds_file(file_path)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Ingestion failed"))
    
    return {
        "status": "success",
        "file": file.filename,
        "indexed": result.get("indexed", 0),
        "skipped": result.get("skipped", 0),
    }


@app.get("/")
async def health_check():
    return {"status": "Jabari Ingestion Engine is online", "phase": "3.0 - The Unified Coworker"}

@app.post("/ingest", response_model=IngestionResponse)
async def ingest_document(
    file: UploadFile = File(...), 
    tender_id: int | None = Form(None),
    db: Session = Depends(get_db)
):
    """
    Core Ingestion Endpoint: Handles Upload, Detection, Extraction, Chunking, and AI Analysis.
    Stages 1-4 of the pipeline.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # 1. Save uploaded file temporarily
    print(f"--- INGESTION START: {file.filename} ---")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"[1/5] File saved to: {file_path}")
    except Exception as e:
        print(f"ERROR Stage 1: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 2. Detect Identity & Intent (Stage 1)
    try:
        detection_result = DocumentDetector.identify(file_path)
        print(f"[2/5] Identity Detected: {detection_result['category']} (OCR: {detection_result['needs_ocr']})")
    except Exception as e:
        print(f"ERROR Stage 2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    
    # 3. Extract Hierarchy & Text (Stage 2)
    extracted_content = ""
    try:
        if detection_result["category"] == "pdf":
            extracted_content = DocumentExtractor.extract_from_pdf(
                file_path, 
                needs_ocr=detection_result["needs_ocr"]
            )
        elif detection_result["category"] == "docx":
            extracted_content = DocumentExtractor.extract_from_docx(file_path)
        elif detection_result["category"] == "image":
            extracted_content = DocumentExtractor.extract_from_image(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        print(f"[3/5] Extraction Complete: {len(extracted_content)} chars")
    except Exception as e:
        print(f"ERROR Stage 3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    
    # 4. Smart Chunking (Stage 3)
    try:
        chunks = DocumentChunker.chunk_text(extracted_content)
        print(f"[4/5] Chunking Complete: {len(chunks)} fragments")
    except Exception as e:
        print(f"ERROR Stage 4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")
    
    # 5. Hybrid AI Analysis (Stage 4)
    print(f"[5/5] Invoking AI Brain (Model: {os.getenv('GROQ_MODEL')})...")
    try:
        analysis = HybridAnalyzer.run(extracted_content)
        print(f"--- INGESTION SUCCESS: {file.filename} ---")
    except Exception as e:
        print(f"ERROR Stage 5: {str(e)}")
        analysis = {"error": f"Analysis failed: {str(e)}", "status": "Failed"}

    # 6. Database Storage & Neural Indexing (Stage 5/6)
    db_doc = None
    try:
        # Check if document exists
        db_doc = db.query(Document).filter(Document.filename == file.filename).first()
        if not db_doc:
            db_doc = Document(
                filename=file.filename,
                category=detection_result["category"],
                summary=analysis.get("brief", "No summary synthesized."),
                status=analysis.get("status", "Verified"),
                tender_id=tender_id
            )
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)
            
            # Neural Embedding of Chunks (Limit to first 50 chunks for safety)
            print(f"[6/5] Vectorizing {min(len(chunks), 50)} fragments for Semantic Search...")
            for chunk_data in chunks[:50]:
                vector = VectorStoreService.embed_text(chunk_data["text"])
                db_chunk = DocumentChunk(
                    document_id=db_doc.id,
                    content=chunk_data["text"],
                    section_hint=chunk_data["section_hint"],
                    embedding=vector
                )
                db.add(db_chunk)
            db.commit()
            print(f"--- INGESTION SUCCESS: Metadata & Vectors Persisted ---")
    except Exception as e:
        print(f"DB ERROR: {e}")

    # Prepare Response for Frontend
    schema_chunks = [DocumentChunkSchema(**c) for c in chunks]
    return IngestionResponse(
        file_name=file.filename,
        category=detection_result["category"],
        needs_ocr=detection_result["needs_ocr"],
        full_content=extracted_content,
        chunks=schema_chunks,
        analysis=analysis,
        metadata={
            "mime_type": detection_result["mime_type"],
            "extension": detection_result["extension"],
            "path": file_path,
            "chunk_count": len(chunks),
            "id": db_doc.id if db_doc else None
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
