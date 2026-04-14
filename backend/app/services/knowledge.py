import os
import json
import gzip
from datetime import datetime
from typing import Any, List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.db import ProcurementRecord, SessionLocal

import requests
import tempfile

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# ─────────────────────────────────────────────────────────────────────────────
# OCDS Kenya Column Mapping (for CSV/Excel)
# ─────────────────────────────────────────────────────────────────────────────
OCDS_COLUMN_MAP = {
    "ocid": ["ocid"],
    "title": ["tender/title", "title", "tender_title", "Tender Title"],
    "description": ["tender/description", "description"],
    "buyer_name": ["parties/0/name", "buyer/name", "buyer", "Procuring Entity"],
    "amount": ["awards/0/value/amount", "tender/value/amount", "amount", "value"],
    "currency": ["awards/0/value/currency", "tender/value/currency", "currency", "Currency"],
    "status": ["tender/status", "status", "Status"],
    "date": ["date", "tender/tenderPeriod/startDate", "Date"],
    "category": ["tender/mainProcurementCategory", "Category"],
    "location": ["tender/deliveryLocations/0/description", "Location"],
}

class KnowledgeService:
    @staticmethod
    def _parse_date(val) -> datetime:
        if val is None: return datetime.utcnow()
        try:
            if pd.isna(val): return datetime.utcnow()
        except Exception: pass
        if isinstance(val, datetime): return val
        date_str = str(val).strip()
        if not date_str: return datetime.utcnow()
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
                try: return datetime.strptime(date_str[:10], fmt)
                except ValueError: continue
        return datetime.utcnow()

    @staticmethod
    def _safe_float(val) -> float:
        try:
            if pd.isna(val): return 0.0
        except Exception: pass
        try: return float(str(val).replace(",", "").strip())
        except (ValueError, TypeError): return 0.0

    @staticmethod
    def clear_all():
        """Wipes all records from the procurement knowledge table."""
        db = SessionLocal()
        try:
            db.query(ProcurementRecord).delete()
            db.commit()
            return {"success": True, "message": "Knowledge vault cleared successfully."}
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    @staticmethod
    def ingest_ocds_file(file_path: str) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        if file_path.endswith(".jsonl.gz"):
            return KnowledgeService._ingest_jsonl(file_path, is_gzip=True)
        elif ext == ".jsonl":
            return KnowledgeService._ingest_jsonl(file_path, is_gzip=False)
        elif ext in (".csv", ".xlsx", ".xls"):
            if not PANDAS_AVAILABLE:
                return {"success": False, "error": "pandas not installed for Excel/CSV"}
            return KnowledgeService._ingest_pandas(file_path)
        else:
            return {"success": False, "error": f"Unsupported format: {ext}"}

    @staticmethod
    def _ingest_jsonl(file_path: str, is_gzip: bool = False) -> Dict[str, Any]:
        db = SessionLocal()
        count = 0
        skipped = 0
        batch_size = 100 
        
        # Performance: Pre-fetch all existing OCIDs
        existing_ocids = set(res[0] for res in db.query(ProcurementRecord.ocid).all())
        current_batch = []
        
        try:
            from app.services.vector_store import VectorStoreService
            f = gzip.open(file_path, 'rt', encoding='utf-8') if is_gzip else open(file_path, 'r', encoding='utf-8')
            with f:
                for line in f:
                    try:
                        data = json.loads(line)
                        ocid = data.get("ocid")
                        if ocid and ocid in existing_ocids:
                            skipped += 1
                            continue
                        
                        tender = data.get("tender", {})
                        awards = data.get("awards", [])
                        buyer_name = data.get("buyer", {}).get("name") or tender.get("procuringEntity", {}).get("name")
                        
                        total_awarded = sum(float(a.get("value", {}).get("amount", 0)) for a in awards)
                        amount = total_awarded if total_awarded > 0 else float(tender.get("value", {}).get("amount", 0))
                        
                        currency = "KES"
                        if awards and awards[0].get("value", {}).get("currency"):
                            currency = awards[0]["value"]["currency"]
                        elif tender.get("value", {}).get("currency"):
                            currency = tender["value"]["currency"]

                        record = ProcurementRecord(
                            ocid=data.get("ocid"),
                            title=tender.get("title") or (awards[0].get("title") if awards else "Untitled"),
                            description=tender.get("description") or (awards[0].get("description") if awards else ""),
                            buyer_name=buyer_name or "Unknown",
                            amount=amount,
                            currency=currency,
                            status=tender.get("status") or (awards[0].get("status") if awards else "active"),
                            category=tender.get("mainProcurementCategory"),
                            location=tender.get("deliveryLocations", [{}])[0].get("description") if tender.get("deliveryLocations") else None,
                            date_published=KnowledgeService._parse_date(data.get("date"))
                        )
                        current_batch.append(record)
                        
                        if len(current_batch) >= batch_size:
                            titles = [r.title for r in current_batch]
                            embeddings = VectorStoreService.embed_text(titles)
                            for i, emb in enumerate(embeddings):
                                current_batch[i].embedding = emb
                            db.add_all(current_batch)
                            db.commit()
                            count += len(current_batch)
                            current_batch = []
                    except Exception:
                        skipped += 1
                
                if current_batch:
                    titles = [r.title for r in current_batch]
                    embeddings = VectorStoreService.embed_text(titles)
                    for i, emb in enumerate(embeddings):
                        current_batch[i].embedding = emb
                    db.add_all(current_batch)
                    db.commit()
                    count += len(current_batch)
            
            return {"success": True, "indexed": count, "skipped": skipped}
        except Exception as e:
            db.rollback()
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    @staticmethod
    def _ingest_pandas(file_path: str) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext in (".xlsx", ".xls"):
                df = pd.read_excel(file_path, dtype=str)
            else:
                try: df = pd.read_csv(file_path, dtype=str, encoding="utf-8")
                except UnicodeDecodeError: df = pd.read_csv(file_path, dtype=str, encoding="latin-1")
            
            db = SessionLocal()
            count = 0
            batch_size = 50
            current_batch = []
            
            from app.services.vector_store import VectorStoreService
            
            cols = list(df.columns)
            resolved = {}
            for field, candidates in OCDS_COLUMN_MAP.items():
                for c in candidates:
                    if c in cols: resolved[field] = c; break
            
            for _, row in df.iterrows():
                try:
                    def val(f): return row.get(resolved.get(f)) if resolved.get(f) else None
                    record = ProcurementRecord(
                        ocid=str(val("ocid") or ""),
                        title=str(val("title") or "Untitled"),
                        description=str(val("description") or ""),
                        buyer_name=str(val("buyer_name") or "Unknown"),
                        amount=KnowledgeService._safe_float(val("amount")),
                        currency=str(val("currency") or "KES"),
                        status=str(val("status") or "active"),
                        category=str(val("category") or ""),
                        location=str(val("location") or ""),
                        date_published=KnowledgeService._parse_date(val("date"))
                    )
                    current_batch.append(record)
                    
                    if len(current_batch) >= batch_size:
                        titles = [r.title for r in current_batch]
                        embeddings = VectorStoreService.embed_text(titles)
                        for i, emb in enumerate(embeddings):
                            current_batch[i].embedding = emb
                        db.add_all(current_batch)
                        db.commit()
                        count += len(current_batch)
                        current_batch = []
                except Exception: continue
                
            if current_batch:
                titles = [r.title for r in current_batch]
                embeddings = VectorStoreService.embed_text(titles)
                for i, emb in enumerate(embeddings):
                    current_batch[i].embedding = emb
                db.add_all(current_batch)
                db.commit()
                count += len(current_batch)
                
            db.close()
            return {"success": True, "indexed": count}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_benchmarks(query: str, db: Session, limit: int = 20, constraints: Dict = None) -> List[Dict]:
        """
        Uses Semantic Search if vectors are available, else keywords.
        Applies structured constraints: status, amount range, date range,
        buyer, category, and location.
        """
        constraints = constraints or {}

        def _apply_constraints(q):
            """Apply all structured filters to a SQLAlchemy query."""
            if constraints.get("status"):
                q = q.filter(ProcurementRecord.status.ilike(f"%{constraints['status']}%"))
            if constraints.get("min_amount") is not None:
                q = q.filter(ProcurementRecord.amount >= constraints["min_amount"])
            if constraints.get("max_amount") is not None:
                q = q.filter(ProcurementRecord.amount <= constraints["max_amount"])
            if constraints.get("date_from"):
                q = q.filter(ProcurementRecord.date_published >= constraints["date_from"])
            if constraints.get("date_to"):
                q = q.filter(ProcurementRecord.date_published <= constraints["date_to"])
            if constraints.get("buyer"):
                q = q.filter(ProcurementRecord.buyer_name.ilike(f"%{constraints['buyer']}%"))
            if constraints.get("category"):
                q = q.filter(ProcurementRecord.category.ilike(f"%{constraints['category']}%"))
            if constraints.get("location"):
                q = q.filter(ProcurementRecord.location.ilike(f"%{constraints['location']}%"))
            return q

        def _serialize(results):
            return [{
                "ocid": r.ocid, "title": r.title, "buyer": r.buyer_name,
                "amount": r.amount, "currency": r.currency,
                "date": r.date_published.isoformat() if r.date_published else None,
                "status": r.status, "category": r.category, "location": r.location
            } for r in results]

        try:
            from app.services.vector_store import VectorStoreService
            vector = VectorStoreService.embed_text(query)

            base_query = _apply_constraints(db.query(ProcurementRecord))
            results = base_query.order_by(
                ProcurementRecord.embedding.l2_distance(vector)
            ).limit(limit).all()

            if results:
                return _serialize(results)
        except Exception as e:
            print(f"Semantic Search Fallback: {e}")

        # Keyword fallback
        stop_words = {"who", "are", "the", "most", "successful", "winning", "for", "from",
                      "at", "to", "in", "is", "a", "an", "and", "of", "with", "all", "give",
                      "me", "show", "find", "list", "get"}
        keywords = [word.strip('?.,!').lower() for word in query.split()
                    if word.lower() not in stop_words and len(word) > 2]

        base_query = _apply_constraints(db.query(ProcurementRecord))

        if not keywords:
            results = base_query.order_by(
                ProcurementRecord.date_published.desc()
            ).limit(limit).all()
        else:
            filters = []
            for kw in keywords:
                term = f"%{kw}%"
                filters.append(ProcurementRecord.title.ilike(term))
                filters.append(ProcurementRecord.buyer_name.ilike(term))
            results = base_query.filter(or_(*filters)).limit(limit).all()

        return _serialize(results)

    @staticmethod
    def sync_ocds_from_url(url: str) -> Dict[str, Any]:
        """
        Live sync from OCDS data publication URL.
        Efficiently streams and processes records.
        """
        try:
            print(f"--- KNOWLEDGE SYNC: Downloading from {url} ---")
            resp = requests.get(url, stream=True)
            resp.raise_for_status()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jsonl.gz") as tmp:
                for chunk in resp.iter_content(chunk_size=8192):
                    tmp.write(chunk)
                path = tmp.name
            
            print(f"--- KNOWLEDGE SYNC: Processing Neural Ingestion ---")
            res = KnowledgeService._ingest_jsonl(path, is_gzip=True)
            
            # Metadata cleanup
            if os.path.exists(path):
                os.remove(path)
                
            return res
        except Exception as e:
            print(f"--- SYNC ERROR: {e} ---")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """Returns aggregate stats from the knowledge base."""
        try:
            total = db.query(ProcurementRecord).count()
            return {"total_records": total}
        except Exception as e:
            return {"total_records": 0, "error": str(e)}

    @staticmethod
    def get_market_insights(db: Session) -> Dict[str, Any]:
        """Aggregate data for the Knowledge Hub dashboard."""
        try:
            record_count = db.query(ProcurementRecord).count()
            if record_count == 0:
                return {
                    "summary": {"total_value": 0, "total_records": 0, "avg_value": 0},
                    "leaderboard": [],
                    "sectors": []
                }

            summary = db.query(
                func.sum(ProcurementRecord.amount).label("total_value"),
                func.count(ProcurementRecord.id).label("total_records"),
                func.avg(ProcurementRecord.amount).label("avg_value")
            ).first()

            leaderboard = db.query(
                ProcurementRecord.buyer_name.label("name"),
                func.count(ProcurementRecord.id).label("count"),
                func.sum(ProcurementRecord.amount).label("value")
            ).group_by(ProcurementRecord.buyer_name).order_by(text("value DESC")).limit(5).all()

            sectors = db.query(
                ProcurementRecord.category.label("category"),
                func.sum(ProcurementRecord.amount).label("value")
            ).group_by(ProcurementRecord.category).order_by(text("value DESC")).limit(3).all()

            return {
                "summary": {
                    "total_value": float(summary.total_value or 0),
                    "total_records": int(summary.total_records or 0),
                    "avg_value": float(summary.avg_value or 0)
                },
                "leaderboard": [dict(row._asdict()) for row in leaderboard],
                "sectors": [dict(row._asdict()) for row in sectors]
            }
        except Exception as e:
            print(f"Insights Error: {e}")
            return {
                "summary": {"total_value": 0, "total_records": 0, "avg_value": 0},
                "leaderboard": [],
                "sectors": []
            }

from sqlalchemy import text
