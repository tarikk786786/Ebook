"""
AGENT C — Cover Discovery Agent
Orchestrates multi-provider search queries across all integrated sources with fallback resilience.
"""
from typing import List, Dict, Any, Optional
import logging
from ..providers.base_provider import CoverCandidate
from ..providers.open_library_provider import OpenLibraryProvider
from ..providers.google_books_provider import GoogleBooksProvider
from ..providers.internet_archive_provider import InternetArchiveProvider
from ..providers.wikimedia_provider import WikimediaCommonsProvider
from ..providers.crossref_provider import CrossrefProvider
from ..providers.embedded_pdf_provider import EmbeddedPdfProvider

class CoverDiscoveryAgent:
    def __init__(self):
        self.logger = logging.getLogger("CoverDiscoveryAgent")
        self.providers = [
            GoogleBooksProvider(),
            OpenLibraryProvider(),
            InternetArchiveProvider(),
            WikimediaCommonsProvider(),
            CrossrefProvider(),
            EmbeddedPdfProvider()
        ]

    def discover(self, metadata: Dict[str, Any]) -> List[CoverCandidate]:
        title = metadata["title"]
        author = metadata["author"]
        isbn = metadata.get("isbn")
        file_name = metadata.get("file_name")

        all_candidates: List[CoverCandidate] = []

        # 1. First priority: If a local/stored file exists, try embedded cover extraction
        embedded_provider = self.providers[-1]
        if isinstance(embedded_provider, EmbeddedPdfProvider) and file_name:
            matched_file = embedded_provider._find_matching_file(file_name, title)
            if matched_file:
                c = embedded_provider.extract_from_file_path(matched_file, title)
                if c:
                    all_candidates.append(c)

        # 2. Query configured online providers in sequence
        for provider in self.providers[:-1]:
            try:
                candidates = provider.search(title=title, author=author, isbn=isbn)
                for candidate in candidates:
                    # Download bytes for visual inspection
                    raw_bytes = provider.download_image(candidate)
                    if raw_bytes:
                        candidate.image_bytes = raw_bytes
                        all_candidates.append(candidate)
                        # If a high-confidence match (>0.90) with verified bytes is found, proceed
                        if candidate.provider_confidence >= 0.90:
                            break
                if all_candidates:
                    break
            except Exception as e:
                self.logger.warning(f"Provider {provider.name} error: {e}")
                continue

        return all_candidates
