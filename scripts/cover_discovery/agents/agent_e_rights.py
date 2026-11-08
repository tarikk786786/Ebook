"""
AGENT E — Rights Verification Agent
Validates source provenance, copyright status, and fair-use catalog display permissions.
"""
from typing import Dict, Any, Tuple
from ..rights_verifier import RightsVerifier
from ..providers.base_provider import CoverCandidate

class RightsVerificationAgent:
    def __init__(self):
        self.verifier = RightsVerifier()

    def verify_candidate(self, candidate: CoverCandidate) -> Tuple[bool, Dict[str, Any]]:
        is_cleared, clearance_score, record = self.verifier.verify(
            rights_type=candidate.rights_type,
            attribution=candidate.attribution,
            source_url=candidate.source_url
        )
        return is_cleared, record
