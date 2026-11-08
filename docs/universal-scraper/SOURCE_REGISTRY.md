# Universal Source Registry & Compliance Matrix

This document provides a verified audit of all configured sources in the AnonTrove Universal Discovery & Ingestion Engine.

---

## Source Inventory & Access Matrix

| Source ID | Name | Category | Protocol / API | Auth Required | Rate Limits | Rights Policy | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `google-books` | Google Books | Search Engines | REST / JSON | API Key (Optional) | 1,000 req/min | Previews & Public Domain | ACTIVE |
| `open-library` | Open Library | Universal Catalogues | REST / JSON | None | 100 req/min | CC0 / Public Domain / Borrow | ACTIVE |
| `internet-archive` | Internet Archive Books | Digital Libraries | Search & Meta API | None | 60 req/min | Public Domain & Lending | ACTIVE |
| `project-gutenberg`| Project Gutenberg | Public Domain | Gutendex API | None | 120 req/min | 100% US Public Domain | ACTIVE |
| `standard-ebooks` | Standard Ebooks | OPDS Typography | OPDS Atom XML | None | 30 req/min | CC0 Public Domain Editions | ACTIVE |
| `doab` | DOAB Directory | Academic Open Access| REST / OAI-PMH | None | 60 req/min | CC Open-Access Monographs | ACTIVE |
| `arxiv` | arXiv Preprints | Scientific Repos | XML API | None (3s sleep)| 20 req/min | Open-Access Scientific Papers| ACTIVE |
| `manybooks` | ManyBooks | Public Domain | Sitemap / HTML | None | 15 req/min | Public Domain / CC | ACTIVE |
| `telegram-coding` | @coding_with_ujjwal| Authorized Channels | MTProto Client | Client Session | Telegram FloodWait | Technical Notes & Guides | ACTIVE |
| `telegram-courseguy`| @courseguy_udemy | Authorized Channels | MTProto Client | Client Session | Telegram FloodWait | Educational Syllabi | ACTIVE |
| `telegram-vault` | Local Telegram Vault | Local Repositories | Filesystem I/O | FS Permissions | Instant | Verified Owned Catalog | ACTIVE |
| `feedbooks-opds` | Feedbooks | OPDS Syndication | OPDS Atom XML | None | 30 req/min | Public Domain Classics | ACTIVE |

---

## Detailed Source Operational Profiles

### 1. Google Books API (`google-books`)
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes`
- **Harvesting Strategy**: Queries by topic keywords, ISBNs, and authors.
- **Classification Rules**: Inspects `accessInfo.viewability` (`FULL_PUBLIC_DOMAIN`, `PARTIAL`, `NO_PAGES`) and `saleInfo.saleability` (`FREE`, `FOR_SALE`, `NOT_FOR_SALE`).
- **Resilience**: When public IP rate limits (HTTP 429) occur, the engine safely flags the source without throwing unhandled exceptions, delegating discovery to Open Library.

### 2. Open Library Search & Works API (`open-library`)
- **Endpoint**: `https://openlibrary.org/search.json`
- **Harvesting Strategy**: Fetches work keys, edition records, ISBN-10/13, cover IDs, and full-text availability markers (`has_fulltext: true`, `public_scan_b: true`).
- **Direct Downloads**: Pulls direct EPUB/PDF download links from Internet Archive backlink keys when `ia` array identifiers exist.

### 3. Internet Archive Advanced Search (`internet-archive`)
- **Endpoint**: `https://archive.org/advancedsearch.php`
- **Collection Filter**: Queries collections restricted to `collection:(gutenberg OR openlibrary OR americana OR historical_texts) AND mediatype:(texts)`.
- **Direct Download Extraction**: Automatically constructs standard direct download URLs:
  `https://archive.org/download/{identifier}/{identifier}.pdf` or `.epub`.

### 4. Project Gutenberg / Gutendex (`project-gutenberg`)
- **Endpoint**: `https://gutendex.com/books`
- **MIME Inspection**: Maps `application/epub+zip`, `application/pdf`, and `application/x-mobipocket-ebook` formats.
- **Copyright Guarantee**: Strictly public domain works verified under Project Gutenberg curation.

### 5. Telegram MTProto Harvester (`telegram-*`)
- **Library**: Python Telethon client with persistent SQLite session file.
- **Account Verification**: Authenticated via API ID, API Hash, and phone session credentials defined in `appinfo11.txt`.
- **Integrity**: Each document attachment is hashed with SHA-256 and matched with file size to eliminate corrupt partial downloads.

---

## Rate Limit Governance
Every network query is wrapped in `PoliteRequester` with:
- Configurable `min_delay_seconds` (default: 0.8s).
- Randomized jitter to avoid synchronized traffic spikes.
- Up to 3 automatic retries with exponential backoff on HTTP 429 and 503 errors.
- Polite User-Agent identifying AnonTrove research crawler.
