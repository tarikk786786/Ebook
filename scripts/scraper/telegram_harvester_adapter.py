"""
Telegram Harvester Adapter: Integrates authorized Telegram channels and local repository archives.
Extracts message references, filenames, SHA256 hashes, formats, and metadata.
"""

import os
import json
from base_adapter import BaseScraperAdapter

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BOOKS_REGISTRY_PATH = os.path.join(PROJECT_ROOT, "data", "books_registry.json")

class TelegramHarvesterAdapter(BaseScraperAdapter):
    def __init__(self):
        super().__init__(
            source_id="telegram-authorized-vault",
            source_name="Authorized Telegram Library",
            base_url="https://t.me",
            rate_limit_delay=0.1
        )
        self.cached_books = []
        self._load_cache()

    def _load_cache(self):
        if os.path.exists(BOOKS_REGISTRY_PATH):
            try:
                with open(BOOKS_REGISTRY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.cached_books = data
                    elif isinstance(data, dict) and "books" in data:
                        self.cached_books = data["books"]
            except Exception as e:
                print(f"[TelegramHarvesterAdapter] Cache load error: {e}")

    def search(self, query, limit=20):
        if not self.cached_books:
            return []

        q = query.lower().strip()
        matches = []
        for b in self.cached_books:
            title = b.get("title", "")
            desc = b.get("description", "")
            author = b.get("author", "")
            channel = b.get("sourceTelegram", "")

            if not q or q in title.lower() or q in desc.lower() or q in author.lower() or q in channel.lower():
                # Determine availability
                availability = "PAID_STORE" if b.get("priceInInr", 0) > 0 else "FREE_AUTHORIZED"

                cover = b.get("coverImage", "")
                if not cover.startswith("http") and not cover.startswith("/"):
                    cover = "/" + cover

                record = {
                    "id": f"tg-{b.get('id', b.get('slug', 'item'))}",
                    "source": f"Telegram ({b.get('sourceTelegram', '@coding_with_ujjwal')})",
                    "sourceId": "telegram-authorized-vault",
                    "title": title,
                    "subtitle": b.get("subtitle", ""),
                    "authors": [author] if author else ["Technical Contributor"],
                    "publisher": "AnonTrove Verified Telegram Library",
                    "publishedDate": b.get("publicationYear") or "2026",
                    "description": desc or f"Technical guide and learning material from authorized channel {b.get('sourceTelegram')}.",
                    "isbns": [b.get("isbn")] if b.get("isbn") else [],
                    "primaryIsbn": b.get("isbn", ""),
                    "pageCount": b.get("pages", 0),
                    "categories": [b.get("category", "Computer Science & Programming")],
                    "language": b.get("language", "en"),
                    "coverImage": cover,
                    "formats": [b.get("format", "PDF")],
                    "availability": availability,
                    "license": "Authorized Channel Educational Distribution",
                    "previewUrl": f"/book/{b.get('slug')}" if b.get('slug') else "",
                    "downloadUrl": f"/book/{b.get('slug')}" if b.get('slug') else "",
                    "infoUrl": b.get("telegramLink") or f"https://t.me/{b.get('sourceTelegram', '').replace('@', '')}",
                    "confidenceScore": 0.98,
                    "telegramMeta": {
                        "sourceChannel": b.get("sourceTelegram"),
                        "messageId": b.get("telegramMessageId"),
                        "sha256": b.get("sha256"),
                        "fileName": b.get("fileName")
                    }
                }
                matches.append(record)
                if len(matches) >= limit:
                    break

        return matches
