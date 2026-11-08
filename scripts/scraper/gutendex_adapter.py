"""
Gutendex / Project Gutenberg Adapter: Queries Gutendex for verified public domain literature.
Extracts direct download links for EPUB, Kindle MOBI, HTML, and UTF-8 plain text.
"""

import urllib.parse
from base_adapter import BaseScraperAdapter

class GutendexAdapter(BaseScraperAdapter):
    def __init__(self):
        super().__init__(
            source_id="project-gutenberg",
            source_name="Project Gutenberg",
            base_url="https://gutendex.com/books",
            rate_limit_delay=0.6
        )

    def search(self, query, limit=20):
        encoded = urllib.parse.quote(query)
        url = f"{self.base_url}?search={encoded}"
        data = self.fetch_json(url, timeout=20)
        if not data or "results" not in data:
            return []

        results = []
        for item in data.get("results", [])[:limit]:
            authors = [a.get("name", "Unknown") for a in item.get("authors", [])]
            formats = item.get("formats", {})

            # Clean formats
            epub_url = formats.get("application/epub+zip")
            mobi_url = formats.get("application/x-mobipocket-ebook")
            pdf_url = formats.get("application/pdf")
            cover_url = formats.get("image/jpeg", "")

            avail_formats = []
            if epub_url:
                avail_formats.append("EPUB")
            if mobi_url:
                avail_formats.append("MOBI")
            if pdf_url:
                avail_formats.append("PDF")
            if "text/plain; charset=utf-8" in formats:
                avail_formats.append("TXT")

            book_id = item.get("id")

            record = {
                "id": f"pg-{book_id}",
                "source": "Project Gutenberg",
                "sourceId": "project-gutenberg",
                "title": item.get("title", "Untitled"),
                "subtitle": "",
                "authors": authors if authors else ["Public Domain Author"],
                "publisher": "Project Gutenberg",
                "publishedDate": "Public Domain",
                "description": f"Classic work indexed in Project Gutenberg. Download count: {item.get('download_count', 0):,}.",
                "isbns": [],
                "primaryIsbn": "",
                "pageCount": 0,
                "categories": item.get("subjects", ["Classic Literature"])[:3],
                "language": (item.get("languages") or ["en"])[0],
                "coverImage": cover_url,
                "formats": avail_formats,
                "availability": "PUBLIC_DOMAIN",
                "license": "Public Domain in the USA",
                "previewUrl": f"https://www.gutenberg.org/ebooks/{book_id}",
                "downloadUrl": epub_url or mobi_url or f"https://www.gutenberg.org/ebooks/{book_id}",
                "infoUrl": f"https://www.gutenberg.org/ebooks/{book_id}",
                "confidenceScore": 1.0
            }
            results.append(record)

        return results
