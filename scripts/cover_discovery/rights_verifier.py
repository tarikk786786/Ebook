"""
Rights Verification & Provenance Engine
Evaluates legal compliance, source attribution, and fair-use catalog display permissions.
"""
from typing import Dict, Any, Tuple

class RightsVerifier:
    def __init__(self):
        # Clearance weightings
        self.rights_matrix = {
            "PUBLIC_DOMAIN": {"clearance_score": 1.0, "risk_level": "ZERO"},
            "CREATIVE_COMMONS": {"clearance_score": 0.98, "risk_level": "LOW"},
            "COMMUNITY_ARCHIVE": {"clearance_score": 0.95, "risk_level": "LOW"},
            "EMBEDDED_ORIGINAL": {"clearance_score": 0.95, "risk_level": "LOW"},
            "PUBLISHER_PROMO": {"clearance_score": 0.90, "risk_level": "MODERATE_FAIR_USE"},
            "PUBLISHER_ACADEMIC": {"clearance_score": 0.90, "risk_level": "MODERATE_FAIR_USE"},
            "UNKNOWN": {"clearance_score": 0.30, "risk_level": "HIGH"}
        }

    def verify(self, rights_type: str, attribution: str, source_url: str) -> Tuple[bool, float, Dict[str, Any]]:
        meta = self.rights_matrix.get(rights_type, self.rights_matrix["UNKNOWN"])
        is_cleared = meta["clearance_score"] >= 0.80

        provenance_record = {
            "rights_type": rights_type,
            "is_cleared": is_cleared,
            "clearance_score": meta["clearance_score"],
            "risk_level": meta["risk_level"],
            "attribution": attribution,
            "source_url": source_url,
            "license_notice": self._get_license_notice(rights_type, attribution)
        }
        return is_cleared, meta["clearance_score"], provenance_record

    def _get_license_notice(self, rights_type: str, attribution: str) -> str:
        if rights_type == "PUBLIC_DOMAIN":
            return "Public Domain book cover art. No copyright restrictions."
        elif rights_type == "CREATIVE_COMMONS":
            return f"Licensed under Creative Commons. Attribution: {attribution}"
        elif rights_type == "COMMUNITY_ARCHIVE":
            return f"Archived via Open Library / Internet Archive bibliographic index. {attribution}"
        elif rights_type in ("PUBLISHER_PROMO", "PUBLISHER_ACADEMIC"):
            return f"Official publisher promotional book jacket reproduction under Fair Use for retail catalog discovery. Source: {attribution}"
        elif rights_type == "EMBEDDED_ORIGINAL":
            return f"First-page artwork extracted directly from original electronic edition."
        return f"Source attribution: {attribution}"
