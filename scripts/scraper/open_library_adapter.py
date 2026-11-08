"""
Open Library Adapter: Discovers bibliographic metadata, high-resolution covers, and borrowing links.
"""

import urllib.parse
from base_adapter import BaseScraperAdapter

class OpenLibraryAdapter(BaseScraperAdapter):
    def __init__(self):
        super().__init__(
            source_id="open-library",
            source_name="Open Library",
            base_url="https://openlibrary.org/search.json",
            rate_limit_delay=0.8
        )

    def search(self, query, limit=20):
        encoded = urllib.parse.quote(query)
        url = f"{self.base_url}?q={encoded}&limit={min(limit, 30)}&fields=key,title,author_name,first_publish_year,isbn,publisher,language,cover_i,ebook_access,has_fulltext,ia"
        data = self.fetch_json(url)
        if not data or "docs" not in data:
            return []

        results = []
        for doc in data.get("docs", []):
            cover_id = doc.get("cover_i")
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
            
            isbns = doc.get("isbn", [])
            publishers = doc.get("publisher", ["Open Library"])
            authors = doc.get("author_name", ["Unknown Author"])
            
            ebook_access = doc.get("ebook_access", "no_ebook")
            has_fulltext = doc.get("has_fulltext", False)
            ia_ids = doc.get("ia", [])
            
            availability = "METADATA_RECORD"
            download_url = None
            license_policy = "Bibliographic Record"
            
            if ebook_access == "public" and has_fulltext and ia_ids:
                availability = "PUBLIC_DOMAIN"
                license_policy = "Open Access / Public Domain (Archive.org)"
                download_url = f"https://archive.org/details/{ia_ids[0]}"
            elif ebook_access == "borrowable" and ia_ids:
                availability = "BORROWABLE"
                license_policy = "Controlled Digital Lending (Internet Archive)"
                download_url = f"https://archive.org/details/{ia_ids[0]}"
            elif has_fulltext and ia_ids:
                availability = "FREE_AUTHORIZED"
                license_policy = "Open Access Archive"
                download_url = f"https://archive.org/details/{ia_ids[0]}"
            
            key = doc.get("key", "").replace("/works/", "")
            
            record = {
                "id": f"ol-{key}",
                "source": "Open Library",
                "sourceId": "open-library",
                "title": doc.get("title", "Untitled"),
                "subtitle": "",
                "authors": authors[:3],
                "publisher": publishers[0] if publishers else "Unknown Publisher",
                "publishedDate": str(doc.get("first_publish_year", "")),
                "description": f"Bibliographic entry cataloged in Open Library with {len(isbns)} known ISBN editions.",
                "isbns": isbns[:5],
                "primaryIsbn": isbns[0] if isbns else "",
                "pageCount": 0,
                "categories": ["Classical & Contemporary Literature"],
                "language": (doc.get("language") or ["en"])[0],
                "coverImage": cover_url,
                "formats": ["EPUB", "PDF", "Borrowable Online"] if has_fulltext else ["Metadata"],
                "availability": availability,
                "license": license_policy,
                "previewUrl": f"https://openlibrary.org{doc.get('key')}",
                "downloadUrl": download_url,
                "infoUrl": f"https://openlibrary.org{doc.get('key')}",
                "confidenceScore": 0.92
            }
            results.append(record)

        return results
