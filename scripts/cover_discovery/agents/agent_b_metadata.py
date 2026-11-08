"""
AGENT B — Book Metadata Researcher
Extracts, cleans, and canonicalizes book metadata, titles, authors, and ISBNs.
"""
import re
from typing import Dict, Any, Optional
import isbnlib

class MetadataResearcherAgent:
    def __init__(self):
        pass

    def clean_title(self, raw_title: str) -> str:
        """Strip file extensions, upload tags, and noisy brackets."""
        title = raw_title
        # Remove file extensions
        title = re.sub(r'\.(pdf|epub|mobi|azw3|zip)$', '', title, flags=re.I)
        # Remove bracketed tags like [Z-Lib.org], (Free Download), etc.
        title = re.sub(r'\[.*?\]', '', title)
        title = re.sub(r'\(.*?(z-lib|libgen|oceanofpdf|free|download|edition|format).*?\)', '', title, flags=re.I)
        # Clean multiple spaces and hyphens
        title = re.sub(r'\s+', ' ', title).strip()
        return title

    def clean_author(self, raw_author: str) -> str:
        """Extract primary author by stripping co-authors, 'with', 'and', etc."""
        if not raw_author:
            return ""
        author = re.sub(r'\s+(with|and|&|feat\.|featuring)\s+.*', '', raw_author, flags=re.I)
        author = author.split(',')[0].strip()
        return author

    def resolve_isbn(self, raw_isbn: Optional[str]) -> Optional[str]:
        """Validate and canonicalize ISBN-10 or ISBN-13."""
        if not raw_isbn:
            return None
        clean = isbnlib.canonical(raw_isbn)
        if clean and (isbnlib.is_isbn10(clean) or isbnlib.is_isbn13(clean)):
            return clean
        return None

    def analyze_book(self, book_record: Dict[str, Any]) -> Dict[str, Any]:
        raw_title = book_record.get("title", "")
        clean_title = self.clean_title(raw_title)
        raw_author = book_record.get("author", "Unknown Author")
        author = self.clean_author(raw_author)
        isbn = self.resolve_isbn(book_record.get("isbn") or book_record.get("isbn13") or book_record.get("isbn10"))

        return {
            "id": book_record.get("id"),
            "raw_title": raw_title,
            "title": clean_title,
            "author": author,
            "isbn": isbn,
            "category": book_record.get("category", "General"),
            "file_name": book_record.get("fileName") or book_record.get("file_name"),
            "existing_cover": book_record.get("coverImage") or book_record.get("cover_image")
        }
