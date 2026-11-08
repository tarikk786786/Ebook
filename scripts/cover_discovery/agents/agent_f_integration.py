"""
AGENT F — Website Integration Agent
Persists verified covers to public storage and updates catalog records and provenance ledgers.
"""
import os
import re
import json
from typing import Dict, Any, Optional

class WebsiteIntegrationAgent:
    def __init__(self, public_covers_dir: str = "projects/anon-trove-ebooks/public/covers", ledger_path: str = "projects/anon-trove-ebooks/data/cover_provenance_ledger.json"):
        self.public_covers_dir = public_covers_dir
        self.ledger_path = ledger_path
        os.makedirs(self.public_covers_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
        self.ledger = self._load_ledger()

    def _load_ledger(self) -> Dict[str, Any]:
        if os.path.exists(self.ledger_path):
            try:
                with open(self.ledger_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_ledger(self):
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            json.dump(self.ledger, f, indent=2)

    def slugify(self, text: str) -> str:
        s = text.lower()
        s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
        return s[:60] if s else "cover"

    def attach_cover(self, book_id: str, title: str, optimized_bytes: bytes, rights_record: Dict[str, Any], visual_metrics: Dict[str, Any], confidence: float) -> str:
        slug = self.slugify(title)
        filename = f"{slug}.jpg"
        file_path = os.path.join(self.public_covers_dir, filename)

        # Write image bytes to public/covers/
        with open(file_path, "wb") as f:
            f.write(optimized_bytes)

        relative_web_url = f"/covers/{filename}"

        # Record in persistent provenance ledger
        self.ledger[book_id] = {
            "book_id": book_id,
            "title": title,
            "cover_url": relative_web_url,
            "confidence": confidence,
            "file_size_bytes": len(optimized_bytes),
            "dimensions": f"{visual_metrics.get('width')}x{visual_metrics.get('height')}",
            "phash": visual_metrics.get("phash"),
            "dhash": visual_metrics.get("dhash"),
            "rights": rights_record
        }
        self._save_ledger()

        return relative_web_url
