from __future__ import annotations
import os
from sqlalchemy.orm import Session
from app.db import Document, DocumentChunk
from groq import Groq

class JabariDrafter:
    """
    Stage 7: Production & Delivery.
    Generates professional bid artifacts (Technical Proposals, Cover Letters).
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key)
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    def generate_draft(self, db: Session, document_id: int, draft_type: str = "technical_proposal") -> dict:
        """
        Synthesizes a professional draft based on vaulted document intelligence.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return {"error": "Document not found in vault."}

        # Retrieve key chunks for context (limit to 8 chunks to stay within token limits)
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).limit(8).all()
        
        # Build context but cap at 3500 characters to avoid token limit (8000 TPM)
        context = ""
        max_context_size = 3500
        for chunk in chunks:
            potential_context = context + "\n\n" + chunk.content
            if len(potential_context) > max_context_size:
                break
            context = potential_context
        
        # Fallback if context is too small
        if not context.strip():
            context = doc.summary or "No content available"

        prompts = {
            "cover_letter": "Write a formal, high-impact cover letter for this tender. Focus on professional excellence and alignment with the requirements.",
            "technical_proposal": "Generate a detailed Technical Proposal structure. Include an Executive Summary, Methodology, and Implementation Plan based on the document content.",
            "compliance_matrix": "Identify the core technical requirements and present them in a structured compliance check-list format."
        }

        selected_prompt = prompts.get(draft_type, prompts["technical_proposal"])

        prompt = f"""
        You are Jabari AI, an expert Bid Manager. 
        Your task is to generate a {draft_type.replace('_', ' ').upper()} for the following tender.
        
        TENDER CONTEXT:
        {context}
        
        INSTRUCTION:
        {selected_prompt}
        
        TONE: 
        Executive, authoritative, and precise. Use professional bidding terminology.
        
        DRAFT OUTPUT:
        """

        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3
            )
            return {
                "title": f"Draft: {doc.filename} ({draft_type.replace('_', ' ').title()})",
                "content": completion.choices[0].message.content,
                "type": draft_type
            }
        except Exception as e:
            return {"error": f"Drafting Sync Error: {str(e)}"}
