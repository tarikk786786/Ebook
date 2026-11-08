"""
Master Orchestrator — Advanced Ebook Cover Discovery System
Executes the multi-agent pipeline to discover, verify, process, and attach covers.
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional
from .agents.agent_b_metadata import MetadataResearcherAgent
from .agents.agent_c_discovery import CoverDiscoveryAgent
from .agents.agent_d_visual import VisualVerificationAgent
from .agents.agent_e_rights import RightsVerificationAgent
from .agents.agent_f_integration import WebsiteIntegrationAgent
from .agents.agent_g_qa import QualityAssuranceAgent

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')

class CoverOrchestrator:
    def __init__(self):
        self.logger = logging.getLogger("CoverOrchestrator")
        self.agent_b = MetadataResearcherAgent()
        self.agent_c = CoverDiscoveryAgent()
        self.agent_d = VisualVerificationAgent()
        self.agent_e = RightsVerificationAgent()
        self.agent_f = WebsiteIntegrationAgent()
        self.agent_g = QualityAssuranceAgent()

    def process_single_book(self, raw_book: Dict[str, Any], overwrite_existing: bool = False) -> Dict[str, Any]:
        book_id = raw_book.get("id")
        current_cover = raw_book.get("coverImage") or raw_book.get("cover_image")

        # Skip if already has a verified local cover and not overwriting
        if current_cover and current_cover.startswith("/covers/") and not overwrite_existing:
            filename = os.path.basename(current_cover)
            disk_path = os.path.join("projects/anon-trove-ebooks/public/covers", filename)
            if os.path.isfile(disk_path) and os.path.getsize(disk_path) > 3000:
                self.logger.info(f"[{book_id}] Already has verified cover {current_cover}. Skipping.")
                return {"status": "SKIPPED_EXISTING", "cover_url": current_cover}

        # Step 1: Agent B (Metadata Research)
        meta = self.agent_b.analyze_book(raw_book)
        self.logger.info(f"[{book_id}] Researching: '{meta['title']}' by {meta['author']} (ISBN: {meta.get('isbn')})")

        # Step 2: Agent C (Cover Discovery across all providers)
        candidates = self.agent_c.discover(meta)
        if not candidates:
            self.logger.warning(f"[{book_id}] No cover candidates found across all providers.")
            return {"status": "NO_CANDIDATE"}

        # Step 3 & 4: Evaluate candidates with Agent D (Visual) and Agent E (Rights)
        for candidate in candidates:
            # Visual inspection
            is_visually_approved, confidence, visual_metrics, optimized_bytes = self.agent_d.verify_candidate(candidate)
            if not is_visually_approved or not optimized_bytes:
                self.logger.info(f"[{book_id}] Candidate rejected by Visual Agent: {visual_metrics.get('rejection_reason')}")
                continue

            # Rights inspection
            is_rights_cleared, rights_record = self.agent_e.verify_candidate(candidate)
            if not is_rights_cleared:
                self.logger.info(f"[{book_id}] Candidate rejected by Rights Agent: {rights_record.get('risk_level')}")
                continue

            # Step 5: Agent F (Website Integration)
            cover_web_url = self.agent_f.attach_cover(
                book_id=book_id,
                title=meta["title"],
                optimized_bytes=optimized_bytes,
                rights_record=rights_record,
                visual_metrics=visual_metrics,
                confidence=confidence
            )

            # Step 6: Agent G (QA Verification)
            qa_ok, qa_msg, qa_meta = self.agent_g.test_cover_asset(cover_web_url)
            if not qa_ok:
                self.logger.error(f"[{book_id}] QA Check failed for {cover_web_url}: {qa_msg}")
                continue

            self.logger.info(f"[{book_id}] Successfully matched & attached cover: {cover_web_url} (Score: {confidence:.2f}, QA: OK)")
            return {
                "status": "SUCCESS",
                "cover_url": cover_web_url,
                "confidence": confidence,
                "provider": candidate.source,
                "rights": rights_record["rights_type"],
                "dimensions": f"{visual_metrics['width']}x{visual_metrics['height']}"
            }

        return {"status": "ALL_CANDIDATES_REJECTED"}

    def run_batch(self, books: List[Dict[str, Any]], limit: Optional[int] = None) -> Dict[str, Any]:
        results = {
            "total_processed": 0,
            "success_count": 0,
            "skipped_count": 0,
            "failed_count": 0,
            "details": []
        }

        target_books = books[:limit] if limit else books
        for idx, book in enumerate(target_books, start=1):
            self.logger.info(f"\n--- Processing Book {idx}/{len(target_books)}: {book.get('title')} ---")
            res = self.process_single_book(book)
            res["book_id"] = book.get("id")
            res["title"] = book.get("title")
            results["details"].append(res)
            results["total_processed"] += 1

            if res["status"] == "SUCCESS":
                results["success_count"] += 1
            elif res["status"] == "SKIPPED_EXISTING":
                results["skipped_count"] += 1
            else:
                results["failed_count"] += 1

        return results
