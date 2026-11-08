"""
Crossref Metadata & Monograph Provider
Provides DOI verification, publisher metadata, and academic monograph identifiers.
"""
import time
import requests
from typing import Optional, List
from .base_provider import BaseCoverProvider, CoverCandidate

class CrossrefProvider(BaseCoverProvider):
    def __init__(self, timeout: int = 12):
        super().__init__(name="Crossref", timeout=timeout, rate_limit_delay=0.5)
        self.api_url = "https://api.crossref.org/works"
        self.headers = {
            "User-Agent": "AnonTroveCoverDiscovery/2.0 (mailto:catalog@anontrove.internal)"
        }

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        candidates = []
        clean_title = title.split(":")[0].strip()
        params = {
            "query.bibliographic": clean_title,
            "rows": 3,
            "filter": "type:book"
        }
        if author:
            params["query.author"] = author

        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(self.api_url, params=params, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("message", {}).get("items", [])
                for item in items:
                    doi = item.get("DOI")
                    publisher = item.get("publisher", "Unknown Publisher")
                    isbns = item.get("ISBN", [])
                    res_links = item.get("link", [])
                    # Crossref items often carry DOIs and publisher landing links
                    img_url = None
                    for link in res_links:
                        if "image" in link.get("content-type", ""):
                            img_url = link.get("URL")
                            break

                    if img_url:
                        candidates.append(CoverCandidate(
                            source=self.name,
                            image_url=img_url,
                            source_url=f"https://doi.org/{doi}" if doi else "https://crossref.org",
                            rights_type="PUBLISHER_ACADEMIC",
                            attribution=f"Crossref Metadata / {publisher}",
                            provider_confidence=0.88,
                            metadata={"doi": doi, "publisher": publisher, "isbns": isbns}
                        ))
        except Exception as e:
            self.logger.warning(f"Crossref query failed: {e}")

        return candidates

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(candidate.image_url, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200 and len(resp.content) > 1500:
                return resp.content
            return None
        except Exception as e:
            self.logger.warning(f"Crossref download failed: {e}")
            return None
