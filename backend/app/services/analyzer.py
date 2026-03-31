from __future__ import annotations
import re
import os
import json
from typing import Any
from groq import Groq
from dotenv import load_dotenv

# Load env for API keys
load_dotenv()

class RegexHeuristics:
    """
    Stage 1: Fast, Local pattern matching for "Tender Metadata".
    Fast and free, but prone to false negatives.
    """
    
    @staticmethod
    def extract_basic_info(text: str) -> dict[str, Any]:
        # Simple patterns (can be expanded)
        tender_id_pattern = r'(?:Tender|RFP|Contract)[\s\w]*?(?:No\.?|Number|ID)[\s:]*?([A-Z0-9\/\-]{5,})'
        due_date_pattern = r'(?:Closing|Due|Submission)[\s]*(?:Date|Time)[\s:]*?(\d{1,2}(?:st|nd|rd|th)?[\s]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w]*[\s]?\d{4})'
        nca_cat_pattern = r'(?:NCA|Category)[\s]*(?:Category|Registration)?[\s:]*?([1-8])'
        
        # Risk keywords
        risk_keywords = ["Liquidated Damages", "Liability", "Joint Venture", "JV", "Performance Bond", "Non-refundable"]
        
        results = {}
        
        # 1. Tender ID
        id_match = re.search(tender_id_pattern, text, re.IGNORECASE)
        results["tender_id"] = {"value": id_match.group(1) if id_match else None, "confidence": 1.0 if id_match else 0.0}
        
        # 2. Due Date
        date_match = re.search(due_date_pattern, text, re.IGNORECASE)
        results["due_date"] = {"value": date_match.group(1) if date_match else None, "confidence": 0.9 if date_match else 0.0}
        
        # 3. NCA Category
        nca_match = re.search(nca_cat_pattern, text, re.IGNORECASE)
        results["nca_category"] = {"value": nca_match.group(1) if nca_match else None, "confidence": 0.8 if nca_match else 0.0}
        
        # 4. Preliminary Risk Flags
        found_risks = [kw for kw in risk_keywords if kw.lower() in text.lower()]
        results["risk_flags"] = {"value": found_risks, "count": len(found_risks)}
        
        return results

class GroqIntakeAgent:
    """
    Stage 2: Deep Semantic Analysis via LLM.
    Used when Regex fails or needs validation.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        if self.api_key:
            try:
                # Direct initialization to bypass potential 'proxies' env var issues on Windows
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"FAILED to initialize Groq client: {e}")
                self.client = None
        else:
            self.client = None
            print("Warning: GROQ_API_KEY not found. LLM analysis will be skipped.")

    def analyze_deeply(self, context_text: str, current_meta: dict[str, Any]) -> dict[str, Any]:
        """
        Uses Llama-3 to extract structured info from the first 15k chars.
        """
        if not self.client:
            return {"error": "LLM_CONFIG_MISSING"}

        # Truncate context to first 15k characters (Intelligent Batching)
        context = context_text[:15000]

        prompt = f"""
        You are an Intake Agent for a Bidding Intelligence Platform called Jabari AI.
        Analyze the following tender document snippet and extract key info in JSON format.
        
        Tender Metadata So Far: {json.dumps(current_meta)}
        
        Document Snippet:
        ---
        {context}
        ---
        
        Please extract/verify:
        1. "tender_id": The official reference number.
        2. "due_date": The official closing deadline.
        3. "nca_category": The required NCA category (e.g., 5 or 6).
        4. "risk_analysis": A list of potential risky clauses (Liability, JV, non-refundable fees).
        5. "brief": A 2-sentence summary of the project.
        
        Return ONLY valid JSON.
        """
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                response_format={"type": "json_object"}
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            return {"error": f"LLM_ANALYSIS_FAILED: {str(e)}"}

class HybridAnalyzer:
    """
    Orchestrator for the "Resilience Chain".
    Fast Regex -> Smart LLM Recovery -> Final Scoring.
    """
    
    @staticmethod
    def run(extracted_text: str) -> dict[str, Any]:
        # 1. Run Regex Heuristics
        meta = RegexHeuristics.extract_basic_info(extracted_text)
        
        # 2. Check if we need the "Brain" (LLM)
        # We invoke LLM if we have low confidence in key fields or need the "Brief"
        needs_llm = False
        if meta["tender_id"]["confidence"] < 0.9 or meta["due_date"]["confidence"] < 0.9:
            needs_llm = True
        
        if needs_llm:
            agent = GroqIntakeAgent()
            deep_meta = agent.analyze_deeply(extracted_text, meta)
            
            if "error" not in deep_meta:
                # Merge and update meta with LLM findings (Validation)
                meta["tender_id"] = {"value": deep_meta.get("tender_id"), "confidence": 1.0, "source": "llm"}
                meta["due_date"] = {"value": deep_meta.get("due_date"), "confidence": 1.0, "source": "llm"}
                meta["nca_category"] = {"value": deep_meta.get("nca_category"), "confidence": 1.0, "source": "llm"}
                meta["risk_analysis"] = deep_meta.get("risk_analysis", [])
                meta["brief"] = deep_meta.get("brief", "No summary available.")
                meta["status"] = "Verified"
            else:
                meta["status"] = "RegexOnly (LLM Failed)"
        else:
            meta["status"] = "Verified (Regex-Match)"
            meta["brief"] = "Automated summary pending LLM verification." # Optionally force LLM for brief
            
        return meta
