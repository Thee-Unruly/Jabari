import os
import json
import gzip
from datetime import datetime
from typing import Any, List, Dict, Optional
from sqlalchemy.orm import Session
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
        try:
            f = gzip.open(file_path, 'rt', encoding='utf-8') if is_gzip else open(file_path, 'r', encoding='utf-8')
            with f:
                for line in f:
                    try:
                        data = json.loads(line)
                        # OCDS JSON structure extraction
                        # Note: OCDS can have multiple awards, we take the first or the tender value
                        tender = data.get("tender", {})
                        awards = data.get("awards", [{}])
                        first_award = awards[0] if awards else {}
                        
                        buyer_name = data.get("buyer", {}).get("name") or tender.get("procuringEntity", {}).get("name")
                        if not buyer_name and data.get("parties"):
                            # Find party with role 'buyer' or 'procuringEntity'
                            for party in data["parties"]:
                                if "buyer" in party.get("roles", []) or "procuringEntity" in party.get("roles", []):
                                    buyer_name = party.get("name")
                                    break

                        amount = float(first_award.get("value", {}).get("amount", tender.get("value", {}).get("amount", 0)))
                        currency = first_award.get("value", {}).get("currency", tender.get("value", {}).get("currency", "KES"))

                        record = ProcurementRecord(
                            ocid=data.get("ocid"),
                            title=tender.get("title") or first_award.get("title") or "Untitled",
                            description=tender.get("description") or first_award.get("description"),
                            buyer_name=buyer_name or "Unknown",
                            amount=amount,
                            currency=currency,
                            status=tender.get("status") or first_award.get("status") or "active",
                            category=tender.get("mainProcurementCategory"),
                            location=tender.get("deliveryLocations", [{}])[0].get("description") if tender.get("deliveryLocations") else None,
                            date_published=KnowledgeService._parse_date(data.get("date"))
                        )
                        db.add(record)
                        count += 1
                        if count % 500 == 0: db.commit()
                    except Exception:
                        skipped += 1
            db.commit()
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
            # Identify columns
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
                    db.add(record)
                    count += 1
                    if count % 500 == 0: db.commit()
                except Exception: continue
            db.commit()
            db.close()
            return {"success": True, "indexed": count}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_benchmarks(query: str, db: Session, limit: int = 20) -> List[Dict]:
        term = f"%{query}%"
        results = db.query(ProcurementRecord).filter(
            ProcurementRecord.title.ilike(term) | ProcurementRecord.buyer_name.ilike(term)
        ).order_by(ProcurementRecord.date_published.desc()).limit(limit).all()
        return [{
            "ocid": r.ocid, "title": r.title, "buyer": r.buyer_name, 
            "amount": r.amount, "currency": r.currency, "date": r.date_published.isoformat() if r.date_published else None,
            "status": r.status, "category": r.category, "location": r.location
        } for r in results]

    @staticmethod
    def get_stats(db: Session) -> Dict:
        return {"total_records": db.query(ProcurementRecord).count()}
