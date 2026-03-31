from __future__ import annotations
import os
import shutil
from typing import Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.services.detector import DocumentDetector
from app.services.extractor import DocumentExtractor
from app.services.chunker import DocumentChunker
from app.services.analyzer import HybridAnalyzer

app = FastAPI(title="Jabari AI - Phase 1 Ingestion Engine")

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

class DocumentChunk(BaseModel):
    text: str
    section_hint: str
    metadata: dict[str, Any]

class IngestionResponse(BaseModel):
    file_name: str
    category: str
    needs_ocr: bool
    full_content: str
    chunks: list[DocumentChunk]
    analysis: dict[str, Any]
    metadata: dict[str, Any]

@app.get("/")
async def health_check():
    return {"status": "Jabari Ingestion Engine is online", "phase": "1.0 - The Vault"}

@app.post("/ingest", response_model=IngestionResponse)
async def ingest_document(file: UploadFile = File(...)):
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

    return IngestionResponse(
        file_name=file.filename,
        category=detection_result["category"],
        needs_ocr=detection_result["needs_ocr"],
        full_content=extracted_content,
        chunks=chunks,
        analysis=analysis,
        metadata={
            "mime_type": detection_result["mime_type"],
            "extension": detection_result["extension"],
            "path": file_path,
            "chunk_count": len(chunks)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
