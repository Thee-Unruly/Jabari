from __future__ import annotations
import re
from typing import Any

class DocumentChunker:
    """
    Implements Hierarchical, Structure-Aware Splitting.
    Stage 3 of the Ingestion Pipeline.
    """

    @staticmethod
    def chunk_text(text: str, max_chars: int = 2000, overlap: int = 200) -> list[dict[str, Any]]:
        """
        Main entry point for chunking.
        1. Splitting by Headings ([H1], [H2], [H3]).
        2. Splitting by Paragraphs (\n\n).
        3. Token-based fallback (sliding window) if a section is too long.
        """
        # Split into logical sections based on the [H] tags we added during extraction
        # regex to find [H1], [H2] etc.
        sections = re.split(r'(\[H\d\].*?\n)', text)
        
        chunks = []
        current_heading = "General"
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            # If this is a header, update the current context
            header_match = re.match(r'\[H(\d)\]\s*(.*)', section)
            if header_match:
                current_heading = header_match.group(2).strip()
                continue
                
            # Now split this section into paragraphs
            paragraphs = section.split('\n\n')
            
            current_chunk_text = ""
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                
                # If adding this paragraph exceeds our limit, save the current chunk and start a new one
                if len(current_chunk_text) + len(para) > max_chars:
                    if current_chunk_text:
                        chunks.append({
                            "text": current_chunk_text.strip(),
                            "section_hint": current_heading,
                            "metadata": {"char_count": len(current_chunk_text)}
                        })
                    
                    # If a single paragraph is too massive, we use character-based sliding window
                    if len(para) > max_chars:
                        sub_chunks = DocumentChunker._sliding_window_split(para, max_chars, overlap)
                        for sub in sub_chunks:
                            chunks.append({
                                "text": sub,
                                "section_hint": current_heading,
                                "metadata": {"char_count": len(sub), "type": "fallback"}
                            })
                        current_chunk_text = "" # Reset
                    else:
                        current_chunk_text = para
                else:
                    if current_chunk_text:
                        current_chunk_text += "\n\n" + para
                    else:
                        current_chunk_text = para
            
            # Finish up any remaining text in the current section
            if current_chunk_text:
                chunks.append({
                    "text": current_chunk_text.strip(),
                    "section_hint": current_heading,
                    "metadata": {"char_count": len(current_chunk_text)}
                })
                
        return chunks

    @staticmethod
    def _sliding_window_split(text: str, k: int, overlap: int) -> list[str]:
        """
        Simple character-based sliding window for massive blocks of text.
        """
        return [text[i:i + k] for i in range(0, len(text), k - overlap)]
