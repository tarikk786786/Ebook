"""
Internet Archive Cover Provider
Retrieves cover images and bibliographic data from archive.org collections.
"""
import time
import requests
from typing import Optional, List
from .base_provider import BaseCoverProvider, CoverCandidate

class InternetArchiveProvider(BaseCoverProvider):
    def __init__(self, timeout: int = 12):
        super().__init__(name="InternetArchive", timeout=timeout, rate_limit_delay=0.6)
        self.search_url = "https://archive.org/advancedsearch.php"
        self.img_base = "https://archive.org/services/img"
        self.headers = {
            "User-Agent": "AnonTroveCoverDiscovery/2.0 (mailto:catalog@anontrove.internal)"
        }

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        candidates = []
        clean_title = title.split(":")[0].strip().replace('"', '')

        q_parts = [f'title:("{clean_title}")', 'mediatype:(texts)']
        if author:
            clean_author = author.split(",")[0].strip().replace('"', '')
            q_parts.append(f'creator:("{clean_author}")')

        query_str = " AND ".join(q_parts)
        params = {
            "q": query_str,
            "fl[]": ["identifier", "title", "creator", "year"],
            "sort[]": "downloads desc",
            "rows": 3,
            "page": 1,
            "output": "json"
        }

        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(self.search_url, params=params, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                docs = data.get("response", {}).get("docs", [])
                for doc in docs:
                    identifier = doc.get("identifier")
                    if identifier:
                        img_url = f"{self.img_base}/{identifier}"
                        candidates.append(CoverCandidate(
                            source=self.name,
                            image_url=img_url,
                            source_url=f"https://archive.org/details/{identifier}",
                            rights_type="PUBLIC_DOMAIN_ARCHIVE",
                            attribution="Internet Archive Non-Profit Digital Library",
                            provider_confidence=0.86,
                            metadata={"identifier": identifier, "year": doc.get("year")}
                        ))
        except Exception as e:
            self.logger.warning(f"Internet Archive search error: {e}")

        return candidates

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(candidate.image_url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 1500:
                return resp.content
            return None
        except Exception as e:
            self.logger.warning(f"Internet Archive download failed for {candidate.image_url}: {e}")
            return None
