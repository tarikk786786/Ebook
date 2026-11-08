"""
Google Books Volume & Cover Provider
Retrieves high-resolution publisher covers via Google Books Volume API with resolution enhancement.
"""
import time
import requests
from typing import Optional, List
from .base_provider import BaseCoverProvider, CoverCandidate

class GoogleBooksProvider(BaseCoverProvider):
    def __init__(self, timeout: int = 6):
        super().__init__(name="GoogleBooks", timeout=timeout, rate_limit_delay=0.3)
        self.api_url = "https://www.googleapis.com/books/v1/volumes"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

    def _enhance_google_url(self, raw_url: str) -> str:
        url = raw_url.replace("http://", "https://")
        # Remove curled edge effect
        url = url.replace("&edge=curl", "")
        # Upscale zoom level from 1 to 2 or 3 for maximum resolution
        if "zoom=1" in url:
            url = url.replace("zoom=1", "zoom=2")
        elif "zoom=0" in url:
            url = url.replace("zoom=0", "zoom=2")
        return url

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        candidates = []
        queries = []

        if isbn:
            clean_isbn = "".join(c for c in isbn if c.isdigit() or c in 'xX')
            queries.append(f"isbn:{clean_isbn}")

        clean_title = title.split(":")[0].strip()
        if author:
            queries.append(f'intitle:"{clean_title}" inauthor:"{author}"')
        queries.append(f'intitle:"{clean_title}"')

        for q in queries[:2]:
            try:
                time.sleep(self.rate_limit_delay)
                resp = requests.get(
                    self.api_url,
                    params={"q": q, "maxResults": 3, "printType": "books"},
                    headers=self.headers,
                    timeout=self.timeout
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("items", [])
                    for item in items:
                        info = item.get("volumeInfo", {})
                        images = info.get("imageLinks", {})
                        raw_url = (
                            images.get("extraLarge") or
                            images.get("large") or
                            images.get("medium") or
                            images.get("thumbnail") or
                            images.get("smallThumbnail")
                        )
                        if raw_url:
                            enhanced_url = self._enhance_google_url(raw_url)
                            volume_id = item.get("id", "")
                            info_link = info.get("infoLink", f"https://books.google.com/books?id={volume_id}")
                            candidates.append(CoverCandidate(
                                source=self.name,
                                image_url=enhanced_url,
                                source_url=info_link,
                                rights_type="PUBLISHER_PROMO",
                                attribution="Google Books Partner Catalog / Publisher Official Metadata",
                                provider_confidence=0.96 if "isbn:" in q else 0.89,
                                metadata={
                                    "volume_id": volume_id,
                                    "publishedDate": info.get("publishedDate"),
                                    "pageCount": info.get("pageCount"),
                                    "categories": info.get("categories", [])
                                }
                            ))
                    if candidates:
                        break
            except Exception as e:
                self.logger.warning(f"Google Books query '{q}' failed: {e}")

        return candidates

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        try:
            time.sleep(self.rate_limit_delay)
            # Try enhanced URL first
            resp = requests.get(candidate.image_url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 1500:
                return resp.content
            # Fallback to standard zoom=1 if zoom=2 or zoom=3 returned 404
            fallback_url = candidate.image_url.replace("zoom=2", "zoom=1").replace("zoom=3", "zoom=1")
            if fallback_url != candidate.image_url:
                resp = requests.get(fallback_url, headers=self.headers, timeout=self.timeout, allow_redirects=True)
                if resp.status_code == 200 and len(resp.content) > 1500:
                    return resp.content
            return None
        except Exception as e:
            self.logger.warning(f"Google Books download failed for {candidate.image_url}: {e}")
            return None
