from __future__ import annotations
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Any

class VectorStoreService:
    """
    Stage 6: Semantic Vectorization.
    Turns document chunks into 384-dimensional mathematical coordinates.
    """
    
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            print("--- INITIALIZING NEURAL MODEL: all-MiniLM-L6-v2 ---")
            # Compact and extremely fast (384-dimensions)
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @staticmethod
    def embed_text(text: str | list[str]) -> list[float] | list[list[float]]:
        """
        Generates embeddings for one or many pieces of text.
        """
        model = VectorStoreService.get_model()
        embeddings = model.encode(text)
        
        # Convert to list for JSON/SQL serialization
        if isinstance(text, str):
            return embeddings.tolist()
        return [e.tolist() for e in embeddings]

    @staticmethod
    def cosine_similarity(v1: list[float], v2: list[float]) -> float:
        """
        Fast local comparison of two semantic vectors.
        """
        v1 = np.array(v1)
        v2 = np.array(v2)
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
