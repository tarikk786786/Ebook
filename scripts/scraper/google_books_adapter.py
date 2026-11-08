"""
Google Books API Adapter: Discovers bibliographic metadata, ISBNs, covers, and availability.
Distinguishes FULL_PUBLIC_DOMAIN / FREE downloads from PARTIAL previews and PAID editions.
"""

import os
import urllib.parse
from base_adapter import BaseScraperAdapter

class GoogleBooksAdapter(BaseScraperAdapter):
    def __init__(self):
        super().__init__(
            source_id="google-books",
            source_name="Google Books",
            base_url="https://www.googleapis.com/books/v1/volumes",
            rate_limit_delay=1.0
        )
        self.api_key = os.getenv("GOOGLE_BOOKS_API_KEY", "")

    def search(self, query, limit=20):
        encoded = urllib.parse.quote(query)
        url = f"{self.base_url}?q={encoded}&maxResults={min(limit, 40)}&printType=books"
        if self.api_key:
            url += f"&key={self.api_key}"
        data = self.fetch_json(url)
        if not data or "items" not in data:
            return []

        results = []
        for item in data.get("items", []):
            vol = item.get("volumeInfo", {})
            access = item.get("accessInfo", {})
            sale = item.get("saleInfo", {})

            # Availability & Rights Classification
            access_view = access.get("accessViewStatus", "")
            is_ebook = access.get("isEbook", False)
            epub_info = access.get("epub", {})
            pdf_info = access.get("pdf", {})
            saleability = sale.get("saleability", "")

            availability = "PREVIEW_ONLY"
            download_url = None
            license_policy = "In-Copyright / Google Books Preview"

            if access_view == "FULL_PUBLIC_DOMAIN" or saleability == "FREE":
                availability = "PUBLIC_DOMAIN" if access_view == "FULL_PUBLIC_DOMAIN" else "FREE_AUTHORIZED"
                license_policy = "Public Domain / Authorized Free Ebook"
                download_url = epub_info.get("downloadLink") or pdf_info.get("downloadLink") or vol.get("canonicalVolumeLink")
            elif saleability == "FOR_SALE":
                availability = "PAID_STORE"
                license_policy = "Commercial Copyright (Available via Google Play Books)"
            elif access.get("viewability") in ["PARTIAL", "ALL_PAGES"]:
                availability = "PREVIEW_ONLY"
            else:
                availability = "METADATA_RECORD"

            # ISBNs
            isbns = []
            for ident in vol.get("industryIdentifiers", []):
                val = ident.get("identifier", "").strip()
                if val:
                    isbns.append(val)

            # High-res cover image
            img_links = vol.get("imageLinks", {})
            cover_url = img_links.get("extraLarge") or img_links.get("large") or img_links.get("medium") or img_links.get("thumbnail") or ""
            if cover_url and cover_url.startswith("http:"):
                cover_url = "https:" + cover_url[5:]

            # Formats
            formats = []
            if epub_info.get("isAvailable"):
                formats.append("EPUB")
            if pdf_info.get("isAvailable"):
                formats.append("PDF")
            if not formats:
                formats = ["Web Preview"]

            record = {
                "id": f"gbooks-{item.get('id')}",
                "source": "Google Books",
                "sourceId": "google-books",
                "title": vol.get("title", "Untitled"),
                "subtitle": vol.get("subtitle", ""),
                "authors": vol.get("authors", ["Unknown Author"]),
                "publisher": vol.get("publisher", "Unknown Publisher"),
                "publishedDate": vol.get("publishedDate", ""),
                "description": vol.get("description", ""),
                "isbns": isbns,
                "primaryIsbn": isbns[0] if isbns else "",
                "pageCount": vol.get("pageCount", 0),
                "categories": vol.get("categories", ["General"]),
                "language": vol.get("language", "en"),
                "coverImage": cover_url,
                "formats": formats,
                "availability": availability,
                "license": license_policy,
                "previewUrl": vol.get("previewLink") or vol.get("infoLink"),
                "downloadUrl": download_url,
                "infoUrl": vol.get("infoLink"),
                "confidenceScore": 0.95
            }
            results.append(record)

        return results
