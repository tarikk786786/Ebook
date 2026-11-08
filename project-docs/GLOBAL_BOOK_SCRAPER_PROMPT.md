# MASTER EXECUTION PROMPT: GLOBAL STARTUP & BUSINESS BOOK DISCOVERY, SCRAPING & CATALOGUE SYSTEM

```markdown
# ANTIGRAVITY MASTER IMPLEMENTATION PROMPT
## Global Startup & Business Book Discovery, Deep Web Scraping, Verification & Catalogue System

Act as an elite principal software engineer, web scraping specialist, data engineer, cybersecurity architect, and search engine designer.

Transform my existing AnonTrove ebook marketplace (Next.js 14, Supabase, Vercel, Backblaze B2) into the world's most comprehensive, authoritative **Worldwide Startup & Business Book Discovery Platform**.

The master seed list is the attached 36-page PDF: **"THE GLOBAL READING LIST: 1,000 Startup & Business Books"** (spanning 25 core business domains from `0001 The Lean Startup` to `1000 Scaling People`).

Do not provide high-level advice, pseudocode, or toy examples. Implement the complete, production-ready, working system directly inside my existing repository.

---

### 1. MISSION OBJECTIVE & SCOPE

Build an autonomous, continuous discovery and enrichment pipeline that:
1. Ingests all 1,000 seed titles from the attached PDF with 100% precision.
2. Discovers millions of relevant business & startup titles across the open web using authorized APIs, publisher sitemaps, university syllabi, and structured web scrapers.
3. Enriches each book with authentic high-resolution covers, verified ISBNs, publisher details, page counts, verified sales/popularity signals, and author biographies.
4. Deduplicates editions, reprints, and translations using multi-identifier canonical matching (ISBN-13, ISBN-10, Google Volume ID, OpenLibrary Work ID).
5. Displays the catalogue on the live website with sub-second faceted search, category filtering, SEO-optimized dynamic pages, and a full-featured admin management dashboard.

---

### 2. CORE TOOLING STACK & SOURCE ARCHITECTURE

Integrate and utilize these specific tools and provider adapters:

#### A. Bibliographic Metadata Providers (Zero-Cost, Authorized, High-Throughput)
- **Google Books API v1:** Primary global metadata, volume preview links, high-res covers (`zoom=1`, `zoom=2`), ISBN-10/13, canonical categories, publication date, and page count.
- **Open Library API (Internet Archive):** Search API (`openlibrary.org/search.json`), Works & Editions API, and direct CDN cover resolution (`covers.openlibrary.org/b/isbn/{isbn}-L.jpg`).
- **Internet Archive Advanced Search:** Public domain verification, open bibliographic records, metadata verification.
- **Wikidata SPARQL Endpoint (`query.wikidata.org`):** Semantic entity resolution, multilingual title matching, author Wikidata IDs, birth/nationality, and publisher entities.
- **Crossref API (`api.crossref.org`):** Academic and business research publication DOIs, journal monograph records.
- **Library of Congress (LOC) API:** National bibliographic records, LCCN, Library of Congress Subject Headings (LCSH).

#### B. Deep Web Discovery & Crawling Framework
- **PyMuPDF (`fitz`) & `pdfplumber`:** High-speed tabular and structural extraction of the 1,000 books from the attached PDF.
- **Scrapy Spider Framework:** Modular crawlers for public publisher catalogues (Penguin Random House, HarperCollins, Wiley, McGraw-Hill, MIT Press, Harvard Business Review Press, Kogan Page).
- **Sitemap Parser (`sitemap.xml` / `robots.txt`):** Automated discovery of publisher catalog deep-links, RSS/Atom new release feeds.
- **Playwright (Python / Node.js):** Headless browser crawler strictly reserved for JavaScript-rendered public reading lists and business school syllabi (Stanford GSB, MIT Sloan, Harvard Business School, Wharton).
- **Schema.org / JSON-LD Extractor (`extruct` / `BeautifulSoup4` + `lxml`):** Extracts `<script type="application/ld+json">` (`@type: Book`, `isbn`, `author`, `offers`).
- **Trafilatura:** Resilient boilerplate-free web text extraction for curated reading lists and book recommendations.

#### C. Search Engine Discovery Connectors
- **SearXNG / Brave Search API / Exa API:** Automated discovery of author homepages, official publisher book landing pages, and verified award winners (Financial Times Business Book of the Year, McKinsey Business Book of the Year, Axiom Business Book Awards).

---

### 3. PHASED IMPLEMENTATION PLAN

#### Phase 1: Master Seed PDF Extraction
- Parse the 36-page attached PDF using `pdfplumber` and `fitz`.
- Extract every single record:
  - Reference number (`0001` to `1000`)
  - Title & Subtitle
  - Author(s)
  - Subject Area (1 to 25 from the table of contents)
- Normalize names, remove OCR noise, and save to canonical seed database: `data/seed_1000_books.json`.

#### Phase 2: Multi-Provider Enrichment Engine
- Build asynchronous enrichment pipeline querying Google Books -> Open Library -> Wikidata.
- For each book, collect:
  - Official ISBN-13 and ISBN-10
  - Publisher & Publication Year
  - High-Resolution Cover Image URL (stored to Backblaze B2 / CDN)
  - Verified Description (synopsis)
  - Page Count & Language
  - Official Google Books Preview URL / Publisher URL
  - Average Reader Rating & Review Count (with explicit source attribution)
- Implement exponential backoff, rate limiting (5 req/sec with token bucket), and disk caching to prevent redundant API calls.

#### Phase 3: Deduplication & Canonical Identity System
- Create a multi-tier matching algorithm:
  1. Primary: Exact ISBN-13 / ISBN-10 match.
  2. Secondary: OpenLibrary Work ID or Google Volume ID match.
  3. Tertiary: Normalized Title + Primary Author fuzzy match (Levenshtein distance >= 92%).
- Distinct editions (Paperback, Hardcover, Audio, Updated Edition) linked as children of a master `Work` entity.

#### Phase 4: Database Schema Extension (Supabase Postgres)
- Implement migration adding:
  - `discovery_books` (id, slug, title, subtitle, author, isbn13, isbn10, publisher, pub_year, pages, language, description, cover_url, rating, review_count, verification_status)
  - `discovery_categories` (id, slug, name, icon, book_count)
  - `discovery_book_categories` (book_id, category_id)
  - `discovery_rankings` (id, book_id, rank_name, year, source_url, verified)
  - `discovery_sources` (id, url, source_type, last_crawled, status)
  - `discovery_audit_log` (id, book_id, change_type, field_changed, old_value, new_value, provenance)
- Enable Row-Level Security (RLS) with public read access and authenticated admin write access.

#### Phase 5: Storefront UI & Discovery Experience
- **Discovery Portal (`/books`):**
  - Instant live search by title, author, ISBN, publisher, or keyword.
  - Faceted filters: Category (25 subject areas), Publication Year, Verified Status, Rating, Format.
  - View switcher: High-density editorial grid vs detailed list table.
  - Sort by: Recommended, Publication Date, Highest Rated, Title A-Z.
- **Individual Book Detail Page (`/books/[slug]`):**
  - Clean typographic editorial design.
  - High-res cover with zoom/lightbox.
  - Bibliographic metadata table (ISBN, Publisher, Pages, Language, Edition).
  - Verified rating with source provenance badge.
  - Official publisher & library links.
  - Full Schema.org JSON-LD `Book` structured data for Google SEO Rich Snippets.
  - Related books from the same subject area and author.

#### Phase 6: Admin Scraper & Discovery Control Center (`/admin/discovery`)
- Real-time job controls: Start, Pause, Resume, Stop, and Retry discovery crawls.
- Progress metrics: Total Books Enriched, Pending Verification, Duplicates Merged, Sources Scanned.
- Manual verification queue: One-click approval/rejection for ambiguous matches.
- CSV / JSON export of the enriched 1,000+ title database.

#### Phase 7: Automated Testing & Verification
- Test PDF parser accuracy (assert all 1,000 titles extracted).
- Test ISBN-13 checksum validation.
- Test Google Books & Open Library adapter mock responses.
- Test deduplication fuzzy matcher against corner cases.
- Run complete Next.js production build (`npm run build`) ensuring zero TypeScript or hydration errors.

---

### 4. STRICT NON-NEGOTIABLE SAFETY & INTEGRITY RULES
1. Never invent an author, ISBN, publisher, cover, publication date, or rating. Use `null` if unverified.
2. Never claim a book is a verified bestseller unless linked to an official published ranking with provenance URL.
3. Respect `robots.txt`, crawl budgets, and provider terms. Never use unauthorized proxy swarms or bypass CAPTCHAs.
4. Keep long-running crawlers in autonomous background workers (`workers/book_discovery_worker.py`), never inside short-lived Vercel serverless request handlers.
5. All secrets and API keys must remain server-side and recorded in `appinfo11.txt`. Never expose keys to client bundles.
```
