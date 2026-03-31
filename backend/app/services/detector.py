import os
from typing import Literal
import pikepdf
import magic
from pathlib import Path

# Initialize magic for file type detection
mime = magic.Magic(mime=True)

class DocumentDetector:
    """
    Identifies the format and "extractability" of documents.
    Determines if OCR is needed for PDF files.
    """
    
    @staticmethod
    def identify(file_path: str) -> dict:
        """
        Detects file type and OCR requirement.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        mime_type = mime.from_file(file_path)
        file_ext = path.suffix.lower()

        result = {
            "mime_type": mime_type,
            "extension": file_ext,
            "needs_ocr": False,
            "category": "unknown"
        }

        # 1. Handle PDFs
        if mime_type == "application/pdf" or file_ext == ".pdf":
            result["category"] = "pdf"
            result["needs_ocr"] = DocumentDetector._pdf_needs_ocr(file_path)
        
        # 2. Handle Word Docs
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or file_ext == ".docx":
            result["category"] = "docx"
            result["needs_ocr"] = False  # DOCX typically doesn't need OCR

        # 3. Handle Images (Scans)
        elif mime_type.startswith("image/"):
            result["category"] = "image"
            result["needs_ocr"] = True

        return result

    @staticmethod
    def _pdf_needs_ocr(file_path: str) -> bool:
        """
        Uses pikepdf to check if a PDF contains any searchable text.
        If no text is found, it's likely a scanned document.
        """
        try:
            with pikepdf.open(file_path) as pdf:
                # Check the first few pages for text content
                # Searchable PDFs have Text objects (/T) or Font descriptors
                has_text = False
                for page in pdf.pages:
                    # Very basic heuristic: check if page has text resources
                    if "/Font" in page.Resources:
                        has_text = True
                        break
                
                # Double check with simplified version: pikepdf doesn't easily extract text
                # We return True (needs OCR) if no Font resources were detected
                return not has_text
        except Exception as e:
            # Fallback to OCR if file is corrupted or unreadable
            print(f"Error analyzing PDF structure: {e}")
            return True
