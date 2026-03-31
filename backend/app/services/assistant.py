from __future__ import annotations
import os
from sqlalchemy.orm import Session
from app.db import DocumentChunk, Document
from app.services.vector_store import VectorStoreService
from groq import Groq
import json

class JabariAssistant:
    """
    Core RAG Engine for conversational intelligence.
    Grounded in the PostgreSQL Neural Vault.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        self.client = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key)

    def ask(self, question: str, db: Session, document_id: int | None = None, tender_id: int | None = None) -> dict:
        """
        Main Q&A loop: Retrieve -> Augment -> Generate
        """
        # 1. Vectorize the User Question
        question_vector = VectorStoreService.embed_text(question)

        # 2. Semantic Search in Postgres
        # We search for the top 5 most relevant chunks
        query = db.query(DocumentChunk, Document).join(Document)
        
        if document_id:
            query = query.filter(DocumentChunk.document_id == document_id)
        elif tender_id:
            query = query.filter(Document.tender_id == tender_id)
            
        # Use pgvector's <-> operator for L2 distance (lowest distance = most similar)
        # Note: We use order_by(DocumentChunk.embedding.l2_distance(question_vector))
        chunks = query.order_by(DocumentChunk.embedding.l2_distance(question_vector)).limit(5).all()

        if not chunks:
            return {"answer": "I couldn't find any relevant information in your vaulted documents.", "citations": []}

        # 3. Construct the Grounded Context
        context_blocks = []
        citations = []
        for chunk, doc in chunks:
            context_blocks.append(f"SOURCE: {doc.filename}\nCONTENT: {chunk.content}")
            citations.append({
                "document_id": doc.id,
                "filename": doc.filename,
                "snippet": chunk.content[:100] + "..."
            })

        full_context = "\n\n---\n\n".join(context_blocks)

        # 4. Invoke LLM with Grounding
        prompt = f"""
        You are Jabari AI, an Executive Bidding Assistant. Your goal is to provide authoritative, 
        concise answers based ONLY on the provided document context.
        
        If the answer isn't in the context, state that you don't know based on the vault content.
        Always maintain a professional, monochromatic 'Executive intelligence' tone.
        
        CONTEXT FROM VAULT:
        {full_context}
        
        QUESTION:
        {question}
        
        ANSWER (Ground every claim in the context provided):
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.2 # Lower temperature for higher factuality
            )
            answer = chat_completion.choices[0].message.content
            return {
                "answer": answer,
                "citations": citations
            }
        except Exception as e:
            return {"error": f"Assistant Brain Error: {str(e)}"}
