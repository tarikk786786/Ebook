"""
Internet Archive Adapter: Queries Archive.org for public-domain and open-access books.
Provides direct links to full verified EPUB and PDF downloads.
"""

import urllib.parse
from base_adapter import BaseScraperAdapter

class InternetArchiveAdapter(BaseScraperAdapter):
    def __init__(self):
        super().__init__(
            source_id="internet-archive",
            source_name="Internet Archive",
            base_url="https://archive.org/advancedsearch.php",
            rate_limit_delay=1.0
        )

    def search(self, query, limit=20):
        # Query for text media types with public domain or open access flags
        solr_q = f"({query}) AND mediatype:texts AND (collection:gutenberg OR collection:americana OR licenseurl:*publicdomain* OR licenseurl:*creativecommons*)"
        params = {
            "q": solr_q,
            "fl[]": "identifier,title,creator,date,description,language,licenseurl,downloads",
            "sort[]": "downloads desc",
            "rows": min(limit, 25),
            "page": 1,
            "output": "json"
        }
        query_str = urllib.parse.urlencode(params, doseq=True)
        url = f"{self.base_url}?{query_str}"

        data = self.fetch_json(url)
        if not data or "response" not in data or "docs" not in data["response"]:
            return []

        results = []
        for doc in data["response"].get("docs", []):
            ident = doc.get("identifier")
            if not ident:
                continue

            title = doc.get("title", "Untitled Archive Work")
            creator = doc.get("creator", "Unknown Author")
            authors = [creator] if isinstance(creator, str) else creator

            cover_url = f"https://archive.org/services/img/{ident}"
            epub_url = f"https://archive.org/download/{ident}/{ident}.epub"
            pdf_url = f"https://archive.org/download/{ident}/{ident}.pdf"

            record = {
                "id": f"ia-{ident}",
                "source": "Internet Archive",
                "sourceId": "internet-archive",
                "title": title,
                "subtitle": "",
                "authors": authors[:3],
                "publisher": "Internet Archive Digital Library",
                "publishedDate": str(doc.get("date", "")),
                "description": doc.get("description", "Digitized public-domain or open-access text available via the Internet Archive."),
                "isbns": [],
                "primaryIsbn": "",
                "pageCount": 0,
                "categories": ["Public Domain & Historical Archives"],
                "language": doc.get("language", "en"),
                "coverImage": cover_url,
                "formats": ["EPUB", "PDF", "DJVU", "TXT"],
                "availability": "PUBLIC_DOMAIN",
                "license": doc.get("licenseurl") or "Open Access Public Domain",
                "previewUrl": f"https://archive.org/details/{ident}",
                "downloadUrl": epub_url,
                "infoUrl": f"https://archive.org/details/{ident}",
                "confidenceScore": 0.95
            }
            results.append(record)

        return results
