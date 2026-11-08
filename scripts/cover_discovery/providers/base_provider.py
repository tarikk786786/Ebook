"""
Base Cover Provider Specification
Abstract Base Class for all cover discovery adapters.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')

@dataclass
class CoverCandidate:
    source: str
    image_url: str
    source_url: str
    rights_type: str  # 'PUBLIC_DOMAIN', 'CREATIVE_COMMONS', 'PUBLISHER_PROMO', 'FAIR_USE_THUMBNAIL'
    attribution: str
    provider_confidence: float  # 0.0 to 1.0
    image_bytes: Optional[bytes] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

class BaseCoverProvider(ABC):
    def __init__(self, name: str, timeout: int = 6, rate_limit_delay: float = 0.3):
        self.name = name
        self.timeout = timeout
        self.rate_limit_delay = rate_limit_delay
        self.logger = logging.getLogger(f"CoverProvider.{name}")

    @abstractmethod
    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        """
        Search for cover candidates matching the given title, author, or ISBN.
        Returns a list of CoverCandidate instances sorted by descending confidence.
        """
        pass

    @abstractmethod
    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        """
        Download raw image bytes for the given candidate with safety checks and timeout.
        """
        pass
