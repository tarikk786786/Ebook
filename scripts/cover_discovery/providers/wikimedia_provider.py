"""
Wikimedia Commons Cover Provider
Searches Wikimedia Commons for public domain and Creative Commons licensed book cover art.
"""
import time
import requests
from typing import Optional, List
from .base_provider import BaseCoverProvider, CoverCandidate

class WikimediaCommonsProvider(BaseCoverProvider):
    def __init__(self, timeout: int = 12):
        super().__init__(name="WikimediaCommons", timeout=timeout, rate_limit_delay=0.6)
        self.api_url = "https://commons.wikimedia.org/w/api.php"
        self.headers = {
            "User-Agent": "AnonTroveCoverDiscovery/2.0 (mailto:catalog@anontrove.internal)"
        }

    def search(self, title: str, author: Optional[str] = None, isbn: Optional[str] = None) -> List[CoverCandidate]:
        candidates = []
        clean_title = title.split(":")[0].strip().replace('"', '')
        search_terms = f'"{clean_title}" cover'

        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": search_terms,
            "gsrnamespace": "6",  # File namespace
            "gsrlimit": 3,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "format": "json"
        }

        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(self.api_url, params=params, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                pages = data.get("query", {}).get("pages", {})
                for page_id, page in pages.items():
                    imageinfo = page.get("imageinfo", [])
                    if imageinfo:
                        info = imageinfo[0]
                        img_url = info.get("url")
                        description_url = info.get("descriptionurl", "")
                        ext = info.get("extmetadata", {})
                        license_short = ext.get("LicenseShortName", {}).get("value", "Public Domain / CC")
                        artist = ext.get("Artist", {}).get("value", "Wikimedia Contributor")

                        if img_url and info.get("size", 0) > 5000:
                            candidates.append(CoverCandidate(
                                source=self.name,
                                image_url=img_url,
                                source_url=description_url,
                                rights_type="CREATIVE_COMMONS",
                                attribution=f"Wikimedia Commons ({license_short} by {artist})",
                                provider_confidence=0.84,
                                metadata={
                                    "license": license_short,
                                    "width": info.get("width"),
                                    "height": info.get("height"),
                                    "title": page.get("title")
                                }
                            ))
        except Exception as e:
            self.logger.warning(f"Wikimedia search failed: {e}")

        return candidates

    def download_image(self, candidate: CoverCandidate) -> Optional[bytes]:
        try:
            time.sleep(self.rate_limit_delay)
            resp = requests.get(candidate.image_url, headers=self.headers, timeout=self.timeout)
            if resp.status_code == 200 and len(resp.content) > 1500:
                return resp.content
            return None
        except Exception as e:
            self.logger.warning(f"Wikimedia download failed: {e}")
            return None
