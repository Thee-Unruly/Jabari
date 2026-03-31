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
