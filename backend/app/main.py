import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.detector import DocumentDetector
from app.services.extractor import DocumentExtractor

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
UPLOAD_DIR = "backend/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class IngestionResponse(BaseModel):
    file_name: str
    category: str
    needs_ocr: bool
    content: str
    metadata: Dict[str, Any]

@app.get("/")
async def health_check():
    return {"status": "Jabari Ingestion Engine is online", "phase": "1.0 - The Vault"}

@app.post("/ingest", response_model=IngestionResponse)
async def ingest_document(file: UploadFile = File(...)):
    """
    Core Ingestion Endpoint: Handles Upload, Detection, and Extraction.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # 1. Save uploaded file temporarily
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # 2. Detect Identity & Intent (Stage 1)
    detection_result = DocumentDetector.identify(file_path)
    
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
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    
    # 4. Prepare Response (Infrastructure for Stage 3 & 4: Chunking/Analysis)
    return IngestionResponse(
        file_name=file.filename,
        category=detection_result["category"],
        needs_ocr=detection_result["needs_ocr"],
        content=extracted_content,
        metadata={
            "mime_type": detection_result["mime_type"],
            "extension": detection_result["extension"],
            "path": file_path
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
