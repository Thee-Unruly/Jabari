from __future__ import annotations
import os
import shutil
from typing import Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
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
from app.db import SessionLocal, init_db, Document, DocumentChunk

# Initialize components
init_db()
assistant = JabariAssistant()

app = FastAPI(title="Jabari AI - Phase 2 Intelligent Vault")

# Dependency for DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    message: str
    document_id: int | None = None

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
            "file_name": d.filename,
            "category": d.category,
            "analysis": {
                "brief": d.summary,
                "status": d.status
            }
        } for d in docs
    ]

@app.get("/")
async def health_check():
    return {"status": "Jabari Ingestion Engine is online", "phase": "2.0 - Neural Vault"}

@app.post("/ingest", response_model=IngestionResponse)
async def ingest_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
                status=analysis.get("status", "Verified")
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
