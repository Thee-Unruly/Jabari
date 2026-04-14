from __future__ import annotations
import os
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db import DocumentChunk, Document, ProcurementRecord
from app.services.vector_store import VectorStoreService
from app.services.knowledge import KnowledgeService
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

    @staticmethod
    def _extract_constraints(question: str) -> dict:
        """
        Parse the user's question for structured filters:
        status, amount range, date range, buyer, category, location.
        """
        q = question.lower()
        constraints = {}

        # ── Status ──────────────────────────────────────────────────────────
        if any(w in q for w in ["active", "open", "ongoing", "live"]):
            constraints["status"] = "active"
        elif any(w in q for w in ["awarded", "completed", "won"]):
            constraints["status"] = "awarded"
        elif any(w in q for w in ["cancelled", "canceled", "terminated"]):
            constraints["status"] = "cancelled"
        elif "pending" in q:
            constraints["status"] = "pending"
        elif "closed" in q:
            constraints["status"] = "closed"

        # ── Amount range ─────────────────────────────────────────────────────
        def parse_amount(s: str) -> float | None:
            s = s.replace(",", "").strip()
            multipliers = {"b": 1_000_000_000, "m": 1_000_000, "k": 1_000}
            if s and s[-1] in multipliers:
                factor = multipliers[s[-1]]
                s = s[:-1]
            else:
                factor = 1
            try:
                return float(s) * factor
            except (ValueError, TypeError):
                return None

        m = re.search(r'(?:under|below|less than|max|maximum)\s+([\d,.]+[kmb]?)', q)
        if m:
            val = parse_amount(m.group(1))
            if val is not None:
                constraints["max_amount"] = val

        m = re.search(r'(?:over|above|more than|min|minimum|at least)\s+([\d,.]+[kmb]?)', q)
        if m:
            val = parse_amount(m.group(1))
            if val is not None:
                constraints["min_amount"] = val

        m = re.search(r'between\s+([\d,.]+[kmb]?)\s+and\s+([\d,.]+[kmb]?)', q)
        if m:
            lo, hi = parse_amount(m.group(1)), parse_amount(m.group(2))
            if lo is not None:
                constraints["min_amount"] = lo
            if hi is not None:
                constraints["max_amount"] = hi

        # ── Date range ───────────────────────────────────────────────────────
        now = datetime.utcnow()
        if any(w in q for w in ["recent", "latest", "new", "current"]):
            constraints["date_from"] = now - timedelta(days=90)
        elif "this year" in q:
            constraints["date_from"] = datetime(now.year, 1, 1)
        elif "last year" in q:
            constraints["date_from"] = datetime(now.year - 1, 1, 1)
            constraints["date_to"] = datetime(now.year - 1, 12, 31)
        elif any(p in q for p in ["last 30 days", "past 30 days"]):
            constraints["date_from"] = now - timedelta(days=30)
        elif any(p in q for p in ["last 6 months", "past 6 months"]):
            constraints["date_from"] = now - timedelta(days=180)
        elif "last month" in q:
            constraints["date_from"] = now - timedelta(days=30)
        else:
            m = re.search(r'\b(20\d{2})\b', q)
            if m:
                year = int(m.group(1))
                constraints["date_from"] = datetime(year, 1, 1)
                constraints["date_to"] = datetime(year, 12, 31)

        # ── Category ─────────────────────────────────────────────────────────
        if any(w in q for w in ["works", "construction", "infrastructure", "building", "road"]):
            constraints["category"] = "works"
        elif any(w in q for w in ["services", "consulting", "professional"]):
            constraints["category"] = "services"
        elif any(w in q for w in ["goods", "supplies", "equipment", "supply", "delivery"]):
            constraints["category"] = "goods"

        # ── Location ─────────────────────────────────────────────────────────
        counties = [
            "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "kisii", "thika",
            "meru", "nyeri", "kakamega", "machakos", "garissa", "isiolo", "lamu",
            "kilifi", "kwale", "turkana", "west pokot", "marsabit", "mandera",
            "wajir", "tana river", "taita taveta", "homa bay", "migori", "siaya",
            "busia", "vihiga", "bungoma", "trans nzoia", "uasin gishu", "elgeyo",
            "nandi", "baringo", "laikipia", "samburu", "isiolo", "meru", "tharaka",
            "embu", "kitui", "makueni", "nyandarua", "nyeri", "kirinyaga",
            "muranga", "kiambu", "narok", "kajiado", "kericho", "bomet",
            "nyamira", "kisii", "rachuonyo", "suba", "siaya", "bondo",
        ]
        for county in counties:
            if county in q:
                constraints["location"] = county
                break

        return constraints

    def ask(self, question: str, db: Session, document_id: int | None = None, tender_id: int | None = None) -> dict:
        """
        Main Q&A loop: Retrieve -> Augment -> Generate
        """
        # 1. Extract structured constraints from the question
        constraints = self._extract_constraints(question)

        # 2. Vectorize the User Question
        question_vector = VectorStoreService.embed_text(question)

        # 3. Semantic Search in Postgres (Vault)
        vault_query = db.query(DocumentChunk, Document).join(Document)
        if document_id:
            vault_query = vault_query.filter(DocumentChunk.document_id == document_id)
        elif tender_id:
            vault_query = vault_query.filter(Document.tender_id == tender_id)

        chunks = vault_query.order_by(DocumentChunk.embedding.l2_distance(question_vector)).limit(5).all()

        # 4. Market Intelligence Grounding (OCDS) — always query, constraints narrow results
        market_trigger_words = [
            "price", "cost", "award", "benchmark", "historical", "market", "tender",
            "vendor", "agency", "buyer", "who", "won", "winning", "active", "all",
            "list", "give me", "show", "find", "sector", "county", "recent",
            "category", "works", "services", "goods", "supplies", "construction",
        ]
        benchmarks = []
        if any(kw in question.lower() for kw in market_trigger_words) or constraints:
            benchmarks = KnowledgeService.get_benchmarks(question[:100], db, constraints=constraints)

        if not chunks and not benchmarks:
            return {"answer": "I couldn't find any relevant information in either your private vault or the historical market archives.", "citations": []}

        # 5. Construct the Grounded Context
        context_blocks = []
        citations = []

        for chunk, doc in chunks:
            context_blocks.append(f"SOURCE: {doc.filename}\nCONTENT: {chunk.content}")
            citations.append({
                "document_id": doc.id,
                "filename": doc.filename,
                "snippet": chunk.content[:100] + "..."
            })

        if benchmarks:
            rows = []
            for b in benchmarks:
                amount_str = f"{b['currency']} {b['amount']:,.0f}" if b.get('amount') else "N/A"
                date_str = b['date'][:10] if b.get('date') else "N/A"
                rows.append(
                    f"- [{b.get('status','N/A').upper()}] {b['title']} | Buyer: {b['buyer']} | "
                    f"Amount: {amount_str} | Category: {b.get('category','N/A')} | "
                    f"Location: {b.get('location','N/A')} | Date: {date_str} | OCID: {b['ocid']}"
                )
            # Build a constraints summary for the LLM
            filter_summary = []
            if constraints.get("status"):
                filter_summary.append(f"status={constraints['status']}")
            if constraints.get("min_amount"):
                filter_summary.append(f"min_amount={constraints['min_amount']:,.0f}")
            if constraints.get("max_amount"):
                filter_summary.append(f"max_amount={constraints['max_amount']:,.0f}")
            if constraints.get("date_from"):
                filter_summary.append(f"from={constraints['date_from'].date()}")
            if constraints.get("date_to"):
                filter_summary.append(f"to={constraints['date_to'].date()}")
            if constraints.get("category"):
                filter_summary.append(f"category={constraints['category']}")
            if constraints.get("location"):
                filter_summary.append(f"location={constraints['location']}")

            filter_note = f" [Filters applied: {', '.join(filter_summary)}]" if filter_summary else ""
            context_blocks.append(
                f"SOURCE: HISTORICAL MARKET INTELLIGENCE (OCDS){filter_note}\n"
                f"TOTAL RESULTS: {len(benchmarks)}\n"
                f"CONTENT:\n" + "\n".join(rows)
            )

        full_context = "\n\n---\n\n".join(context_blocks)

        # 6. Invoke LLM with Grounding
        prompt = f"""
        You are Jabari AI, an Executive Bidding Assistant for the Kenyan procurement market.
        Your goal is to provide authoritative, precise answers grounded in both the user's 
        private vault and the historical market intelligence base (OCDS Kenya data).

        Rules:
        - Items labeled 'HISTORICAL MARKET INTELLIGENCE' are real records from Kenya's procurement portal.
        - When listing tenders, present them clearly with title, buyer, amount, status, and date.
        - If filters were applied (e.g. status=active), confirm this in your answer.
        - If the answer isn't in the context, say so clearly — never fabricate data.
        - Maintain a professional, executive intelligence tone.

        CONTEXT:
        {full_context}

        QUESTION:
        {question}

        ANSWER (Ground every claim in the context. If listing records, present them as a structured list):
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.1
            )
            answer = chat_completion.choices[0].message.content
            return {
                "answer": answer,
                "citations": citations,
                "constraints": constraints,
            }
        except Exception as e:
            return {"error": f"Assistant Brain Error: {str(e)}"}
