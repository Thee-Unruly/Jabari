from __future__ import annotations
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import Document, DocumentChunk
from app.services.vector_store import VectorStoreService
from groq import Groq

class JabariDrafter:
    """
    Stage 7: Production & Delivery.
    Generates professional bid artifacts (Technical Proposals, Cover Letters).
    Includes smart vault reuse: searches past proposals for relevant content
    before generating, so repetitive sections are adapted rather than reinvented.
    """

    REUSE_THRESHOLD = 0.55   # cosine similarity minimum to consider a past chunk reusable
    REUSE_LIMIT     = 6      # max past chunks to pull in
    MAX_REUSE_CHARS = 2400   # cap on total reuse context to keep within token budget
    MAX_SOURCE_CHARS = 3000  # cap on current-document context

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key)
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    # ─────────────────────────────────────────────
    # Vault reuse: find similar past-proposal chunks
    # ─────────────────────────────────────────────
    def _search_vault_for_reuse(
        self,
        db: Session,
        exclude_document_id: int,
        query_text: str,
    ) -> list[dict]:
        """
        Embeds query_text and finds the most similar chunks stored in the vault
        from documents OTHER than the current one.
        Returns a de-duplicated list (one best chunk per source document).
        """
        try:
            query_vec = VectorStoreService.embed_text(query_text)
            vec_str = "[" + ",".join(str(x) for x in query_vec) + "]"

            rows = db.execute(text("""
                SELECT dc.content,
                       dc.section_hint,
                       d.filename,
                       1 - (dc.embedding <=> CAST(:qv AS vector)) AS similarity
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                WHERE dc.document_id != :doc_id
                  AND dc.embedding IS NOT NULL
                  AND 1 - (dc.embedding <=> CAST(:qv AS vector)) > :thresh
                ORDER BY dc.embedding <=> CAST(:qv AS vector)
                LIMIT :lim
            """), {
                "qv":     vec_str,
                "doc_id": exclude_document_id,
                "thresh": self.REUSE_THRESHOLD,
                "lim":    self.REUSE_LIMIT,
            }).fetchall()

            # De-duplicate: keep the highest-similarity chunk per source document
            seen: dict[str, dict] = {}
            for row in rows:
                fname = row.filename
                sim   = round(float(row.similarity), 3)
                if fname not in seen or sim > seen[fname]["similarity"]:
                    seen[fname] = {
                        "filename":     fname,
                        "content":      row.content,
                        "section_hint": row.section_hint or "",
                        "similarity":   sim,
                    }
            return list(seen.values())
        except Exception as e:
            print(f"[Drafter] Vault reuse search error: {e}")
            return []

    # ─────────────────────────────────────────────
    # Main draft generation
    # ─────────────────────────────────────────────
    def generate_draft(
        self,
        db: Session,
        document_id: int,
        draft_type: str = "technical_proposal",
        use_vault_reuse: bool = True,
    ) -> dict:
        """
        Synthesizes a professional draft.
        If use_vault_reuse=True (default), the vault is searched first for relevant
        past-proposal content which is then adapted into the new draft instead of
        being regenerated from scratch.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return {"error": "Document not found in vault."}

        # ── 1. Build current-document context ──
        chunks = db.query(DocumentChunk)\
                   .filter(DocumentChunk.document_id == document_id)\
                   .limit(8).all()

        source_context = ""
        for chunk in chunks:
            candidate = source_context + "\n\n" + chunk.content
            if len(candidate) > self.MAX_SOURCE_CHARS:
                break
            source_context = candidate
        if not source_context.strip():
            source_context = doc.summary or "No content available"

        # ── 2. Search vault for reusable past content ──
        reused_from: list[dict] = []
        reuse_block = ""

        if use_vault_reuse:
            # Use the first ~600 chars of current context as the search query
            query_sample = source_context[:600]
            past_chunks  = self._search_vault_for_reuse(db, document_id, query_sample)

            if past_chunks:
                reuse_lines: list[str] = []
                total_chars = 0
                for r in past_chunks:
                    snippet = r["content"][:700]
                    if total_chars + len(snippet) > self.MAX_REUSE_CHARS:
                        break
                    hint_label = f" [{r['section_hint']}]" if r["section_hint"] else ""
                    reuse_lines.append(
                        f"[SOURCE: {r['filename']}{hint_label} | "
                        f"Relevance: {int(r['similarity'] * 100)}%]\n{snippet}"
                    )
                    total_chars += len(snippet)
                    reused_from.append({
                        "filename":   r["filename"],
                        "similarity": r["similarity"],
                        "section":    r["section_hint"],
                    })

                if reuse_lines:
                    reuse_block = (
                        "\n\nPAST PROPOSAL REFERENCES — RETRIEVED FROM YOUR VAULT:\n"
                        "(These are relevant sections from your previous proposals. "
                        "Adapt and reuse them where appropriate.)\n\n"
                        + "\n\n---\n\n".join(reuse_lines)
                    )

        # ── 3. Build prompt ──
        prompts = {
            "cover_letter":       "Write a formal, high-impact cover letter for this tender. "
                                  "Focus on professional excellence and alignment with requirements.",
            "technical_proposal": "Generate a detailed Technical Proposal. Include an Executive Summary, "
                                  "Methodology, Team Structure, and Implementation Plan.",
            "compliance_matrix":  "Identify every technical requirement and present a structured "
                                  "compliance matrix table with a Yes/Partial/No response column.",
        }
        selected_prompt = prompts.get(draft_type, prompts["technical_proposal"])

        reuse_instruction = (
            "\nIMPORTANT: Past proposal references are provided above. "
            "Actively reuse and adapt relevant sections rather than generating from scratch. "
            "Where you reuse content, note the source inline as (ref: <filename>)."
            if reuse_block else ""
        )

        prompt = f"""You are Jabari AI, an expert Bid Manager.
Your task is to generate a {draft_type.replace('_', ' ').upper()} for the following tender.

CURRENT TENDER CONTEXT:
{source_context}
{reuse_block}

INSTRUCTION:
{selected_prompt}
{reuse_instruction}

TONE:
Executive, authoritative, and precise. Use professional bidding terminology.

DRAFT OUTPUT:"""

        # ── 4. Call LLM ──
        try:
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
            )
            return {
                "title":       f"Draft: {doc.filename} ({draft_type.replace('_', ' ').title()})",
                "content":     completion.choices[0].message.content,
                "type":        draft_type,
                "reused_from": reused_from,   # [] if no matches or reuse disabled
            }
        except Exception as e:
            return {"error": f"Drafting Sync Error: {str(e)}"}
