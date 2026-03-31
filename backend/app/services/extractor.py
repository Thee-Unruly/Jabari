from __future__ import annotations
import os
import pdfplumber
import docx
from typing import Any
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

class DocumentExtractor:
    """
    Handles extracting text structured by headings or regions.
    Supports PDF (Digital/Scanned) and DOCX.
    """

    @staticmethod
    def extract_from_pdf(file_path: str, needs_ocr: bool = False) -> str:
        """
        Extracts content from a PDF. If it's a scanned PDF, uses OCR.
        """
        if needs_ocr:
            return DocumentExtractor._extract_with_ocr(file_path)
        
        # Digital PDF extraction with pdfplumber
        full_text = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    # Extract text and tables
                    page_text = page.extract_text()
                    if page_text:
                        full_text.append(page_text)
                    
                    # Basic table preservation (simplified)
                    tables = page.extract_tables()
                    for table in tables:
                        # Convert table to simple text representation (Markdown-like)
                        table_str = "\n[TABLE START]\n"
                        for row in table:
                            # Filter None values and join with |
                            table_str += " | ".join([str(cell or "") for cell in row]) + "\n"
                        table_str += "[TABLE END]\n"
                        full_text.append(table_str)
            
            return "\n\n".join(full_text)
        except Exception as e:
            print(f"Error extracting digital PDF: {e}")
            return DocumentExtractor._extract_with_ocr(file_path)

    @staticmethod
    def extract_from_docx(file_path: str) -> str:
        """
        Extracts content from WORD while preserving [H1], [H2] hierarchy.
        """
        doc = docx.Document(file_path)
        full_text = []
        
        for para in doc.paragraphs:
            # Check style to preserve hierarchy
            style = para.style.name.lower()
            text = para.text.strip()
            
            if not text:
                continue

            if "heading 1" in style:
                full_text.append(f"[H1] {text}")
            elif "heading 2" in style:
                full_text.append(f"[H2] {text}")
            elif "heading 3" in style:
                full_text.append(f"[H3] {text}")
            else:
                full_text.append(text)
        
        return "\n\n".join(full_text)

    @staticmethod
    def _extract_with_ocr(file_path: str) -> str:
        """
        Converts PDF pages to images and runs Tesseract OCR.
        """
        # Note: requires poppler installed on the system path
        try:
            pages = convert_from_path(file_path)
            ocr_text = []
            
            for i, page in enumerate(pages):
                # Basic OCR
                text = pytesseract.image_to_string(page)
                ocr_text.append(f"[PAGE {i+1} OCR]\n{text}")
            
            return "\n\n".join(ocr_text)
        except Exception as e:
            return f"OCR Extraction Failed: {str(e)}"

    @staticmethod
    def extract_from_image(file_path: str) -> str:
        """
        Extracts text from a standalone image using OCR.
        """
        try:
            img = Image.open(file_path)
            return pytesseract.image_to_string(img)
        except Exception as e:
            return f"Image OCR Failed: {str(e)}"
