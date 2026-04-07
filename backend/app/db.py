from __future__ import annotations
import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

load_dotenv()

# We target a vector size of 384 for the all-MiniLM-L6-v2 model (industry standard for speed/performance)
EMBEDDING_SIZE = 384
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/jabari_vault")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Tender(Base):
    """
    Project / Tender metadata grouping multiple vault documents.
    """
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="tender", cascade="all, delete-orphan")


class Document(Base):
    """
    Metadata for the entire Ingested Document.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    category = Column(String) # pdf, docx, etc.
    summary = Column(Text) # AI executive briefing
    status = Column(String, default="Verified") 
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=True)
    tender = relationship("Tender", back_populates="documents")

    # Relationship to chunks
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    """
    Atomized sections of a document for semantic search.
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(Text)
    section_hint = Column(String)
    
    # The actual semantic vector for the chunk
    embedding = Column(Vector(EMBEDDING_SIZE)) 

    document = relationship("Document", back_populates="chunks")

class ProcurementRecord(Base):
    """
    Jabari Knowledge: Historical tender data from OCDS.
    Used for pricing benchmarks and market intelligence.
    """
    __tablename__ = "procurement_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    ocid = Column(String, index=True) # Open Contracting ID
    title = Column(String, index=True)
    description = Column(Text)
    buyer_name = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String, default="KES")
    status = Column(String)
    category = Column(String, nullable=True)   # procurement category
    location = Column(String, nullable=True)   # delivery location / region
    date_published = Column(DateTime)
    
    # Optional semantic vector for finding "similar" past tenders
    embedding = Column(Vector(EMBEDDING_SIZE), nullable=True) 


def init_db():
    # Attempt to create extension if it's a Vector-enabled DB
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    except Exception as e:
        print(f"Warning: Could not enable pgvector extension: {e}")
        print("Note: If you are seeing this, ensure you have PostgreSQL 11+ and the pgvector extension installed.")

    Base.metadata.create_all(bind=engine)
    print("VAULT DB: Postgres Tables Synchronized with Neural Support")

if __name__ == "__main__":
    init_db()
