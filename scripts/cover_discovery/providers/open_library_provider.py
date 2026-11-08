"""
Open Library Cover Provider
Integrates Open Library Covers API and Search API for ISBN, OLID, and title matching.
"""
import time
import requests
from typing import Optional, List
from .base_provider import BaseCoverProvider, CoverCandidate

class OpenLibraryProvider(BaseCoverProvider):
    def __init__(self, timeout: int = 6):
        super().__init__(name="OpenLibrary", timeout=timeout, rate_limit_delay=0.3)
        self.covers_base = "https://covers.openlibrary.org/b"
        self.search_api = "https://openlibrary.org/search.json"
        self.headers = {
            "User-Agent": "AnonTroveCoverDiscovery/2.0 (mailto:catalog@anontrove.internal)"
        }

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        candidates = []

        # 1. Primary path: Search by verified ISBN
        if isbn:
            clean_isbn = "".join(c for c in isbn if c.isdigit() or c in 'xX')
            if len(clean_isbn) in (10, 13):
                url = f"{self.covers_base}/isbn/{clean_isbn}-L.jpg?default=false"
                candidates.append(CoverCandidate(
                    source=self.name,
                    image_url=url,
                    source_url=f"https://openlibrary.org/isbn/{clean_isbn}",
                    rights_type="COMMUNITY_ARCHIVE",
                    attribution="Open Library / Internet Archive Book Repository",
                    provider_confidence=0.95,
                    metadata={"isbn": clean_isbn, "lookup_type": "direct_isbn"}
                ))

        # 2. Secondary path: Query Open Library Search API
        try:
            params = {"title": title, "limit": 3}
            if author:
                params["author"] = author

            time.sleep(self.rate_limit_delay)
            resp = requests.get(self.search_api, params=params, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                docs = data.get("docs", [])
                for doc in docs[:3]:
                    cover_i = doc.get("cover_i")
                    if cover_i and cover_i > 0:
                        img_url = f"{self.covers_base}/id/{cover_i}-L.jpg?default=false"
                        doc_key = doc.get("key", "")
                        candidates.append(CoverCandidate(
                            source=self.name,
                            image_url=img_url,
                            source_url=f"https://openlibrary.org{doc_key}" if doc_key else "https://openlibrary.org",
                            rights_type="COMMUNITY_ARCHIVE",
                            attribution="Open Library / Internet Archive Public Metadata",
                            provider_confidence=0.88 if not isbn else 0.82,
                            metadata={"cover_i": cover_i, "edition_key": doc.get("cover_edition_key")}
                        ))
        except Exception as e:
            self.logger.warning(f"Open Library Search API error: {e}")

        return candidates

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(candidate.image_url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
            if resp.status_code == 200:
                # Open Library sometimes returns 1x1 GIF (approx 43 bytes) if default=false is ignored
                if len(resp.content) > 1000 and not resp.content.startswith(b'GIF8'):
                    return resp.content
                elif len(resp.content) > 2000:
                    return resp.content
            return None
        except Exception as e:
            self.logger.warning(f"Download failed for {candidate.image_url}: {e}")
            return None
