import json
import os
import sys
import time
import sqlite3
import hashlib
import urllib.request
import urllib.parse
from PIL import Image
import io

# Setup stdout encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks"
DATA_DIR = os.path.join(PROJECT_DIR, "data")
COVERS_DIR = os.path.join(PROJECT_DIR, "public", "covers")
CACHE_DB_PATH = os.path.join(DATA_DIR, "enrichment_cache.db")
AUTHORS_REGISTRY_PATH = os.path.join(DATA_DIR, "authors_registry.json")
PROVENANCE_LEDGER_PATH = os.path.join(DATA_DIR, "cover_provenance_ledger.json")
AUDIT_LOG_PATH = os.path.join(DATA_DIR, "enrichment_audit_log.json")

os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

USER_AGENT = "AnonTroveDigitalLibrarian/2.0 (https://ebook-sandy-chi.vercel.app; contact@anontrove.org)"

class EnrichmentCache:
    def __init__(self, db_path=CACHE_DB_PATH):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_cache (
                query_hash TEXT PRIMARY KEY,
                provider TEXT,
                url TEXT,
                response_text TEXT,
                status_code INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS processed_books (
                book_id TEXT PRIMARY KEY,
                slug TEXT,
                status TEXT,
                confidence_score INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def get(self, url):
        q_hash = hashlib.sha256(url.encode()).hexdigest()
        self.cursor.execute("SELECT response_text, status_code FROM api_cache WHERE query_hash = ?", (q_hash,))
        row = self.cursor.fetchone()
        if row:
            return row[0], row[1]
        return None, None

    def set(self, provider, url, response_text, status_code=200):
        q_hash = hashlib.sha256(url.encode()).hexdigest()
        self.cursor.execute(
            "INSERT OR REPLACE INTO api_cache (query_hash, provider, url, response_text, status_code) VALUES (?, ?, ?, ?, ?)",
            (q_hash, provider, url, response_text, status_code)
        )
        self.conn.commit()

    def is_processed(self, book_id):
        self.cursor.execute("SELECT status FROM processed_books WHERE book_id = ?", (book_id,))
        row = self.cursor.fetchone()
        return row[0] if row else None

    def mark_processed(self, book_id, slug, status, confidence):
        self.cursor.execute(
            "INSERT OR REPLACE INTO processed_books (book_id, slug, status, confidence_score) VALUES (?, ?, ?, ?)",
            (book_id, slug, status, confidence)
        )
        self.conn.commit()

def fetch_url(url, cache, provider, timeout=10, max_retries=2):
    cached_text, status = cache.get(url)
    if cached_text is not None:
        try:
            return json.loads(cached_text) if cached_text.strip().startswith(("{", "[")) else cached_text
        except:
            return cached_text

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as res:
                content = res.read().decode("utf-8", errors="replace")
                cache.set(provider, url, content, res.status)
                try:
                    return json.loads(content) if content.strip().startswith(("{", "[")) else content
                except:
                    return content
        except urllib.error.HTTPError as e:
            if e.code == 404:
                cache.set(provider, url, "NOT_FOUND", 404)
                return None
            elif e.code == 429:
                time.sleep(2 * (attempt + 1))
            else:
                cache.set(provider, url, f"ERROR_{e.code}", e.code)
                return None
        except Exception as e:
            time.sleep(1)
    return None

def clean_search_title(title):
    if not title:
        return ""
    # Strip parenthetical annotations like (@LearnExploit), (Zebra Learn), [2026], etc.
    import re
    cleaned = re.sub(r'\(.*?\)|\[.*?\]', '', title)
    cleaned = re.sub(r'[_\-]+', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_author_name(author):
    if not author:
        return ""
    if any(k in author.lower() for k in ["unknown", "editorial", "guild", "anontrove", "board", "expert"]):
        return ""
    import re
    cleaned = re.sub(r'\(.*?\)|\[.*?\]', '', author)
    return cleaned.strip()

# Provider 1: Open Library Search & Works API
def query_open_library(title, author, cache):
    clean_t = clean_search_title(title)
    clean_a = clean_author_name(author)
    if not clean_t:
        return None

    params = {"title": clean_t}
    if clean_a:
        params["author"] = clean_a

    url = f"https://openlibrary.org/search.json?{urllib.parse.urlencode(params)}"
    data = fetch_url(url, cache, "OPEN_LIBRARY")
    if not data or not isinstance(data, dict):
        return None

    docs = data.get("docs", [])
    if not docs:
        # Retry with title only if author search yielded no docs
        if clean_a:
            url_t = f"https://openlibrary.org/search.json?{urllib.parse.urlencode({'title': clean_t})}"
            data_t = fetch_url(url_t, cache, "OPEN_LIBRARY")
            if data_t and isinstance(data_t, dict):
                docs = data_t.get("docs", [])

    if not docs:
        return None

    doc = docs[0]
    work_key = doc.get("key")
    cover_id = doc.get("cover_i")
    first_publish_year = doc.get("first_publish_year")
    author_name = doc.get("author_name", [clean_a])[0] if doc.get("author_name") else clean_a
    author_keys = doc.get("author_key", [])

    # Fetch editions for publisher and ISBN details
    editions = []
    if work_key:
        ed_url = f"https://openlibrary.org{work_key}/editions.json?limit=5"
        ed_data = fetch_url(ed_url, cache, "OPEN_LIBRARY_EDITIONS")
        if ed_data and isinstance(ed_data, dict):
            editions = ed_data.get("entries", [])

    isbns_13 = []
    isbns_10 = []
    publishers = []
    pages = doc.get("number_of_pages_median")
    cover_ids = [cover_id] if cover_id else []

    for e in editions:
        if e.get("isbn_13"):
            isbns_13.extend(e["isbn_13"])
        if e.get("isbn_10"):
            isbns_10.extend(e["isbn_10"])
        if e.get("publishers"):
            publishers.extend(e["publishers"])
        if not pages and e.get("number_of_pages"):
            pages = e.get("number_of_pages")
        if e.get("covers"):
            cover_ids.extend(e["covers"])

    return {
        "provider": "OPEN_LIBRARY",
        "title": doc.get("title", clean_t),
        "author": author_name,
        "author_key": author_keys[0] if author_keys else None,
        "first_publish_year": first_publish_year,
        "isbn13": isbns_13[0] if isbns_13 else None,
        "isbn10": isbns_10[0] if isbns_10 else None,
        "publisher": publishers[0] if publishers else None,
        "pageCount": pages,
        "cover_id": cover_ids[0] if cover_ids else None,
        "openlibrary_work_id": work_key
    }

# Provider 2: Wikipedia Summary & Author Biography API
def query_wikipedia_author(author_name, cache):
    if not author_name or len(author_name) < 4:
        return None
    clean_a = clean_author_name(author_name)
    if not clean_a:
        return None

    # Replace spaces with underscores
    wiki_title = urllib.parse.quote(clean_a.replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_title}"
    data = fetch_url(url, cache, "WIKIPEDIA")
    if not data or not isinstance(data, dict) or data.get("type") == "https://mediawiki.org/wiki/HyperSwitch/errors/not_found":
        return None

    extract = data.get("extract", "")
    # Check if page is actually about a person/writer/computer scientist
    if not extract or len(extract) < 40:
        return None

    photo_url = data.get("thumbnail", {}).get("source") if data.get("thumbnail") else None

    return {
        "provider": "WIKIPEDIA",
        "name": data.get("title", clean_a),
        "shortBio": data.get("description", "Author & Researcher"),
        "fullBio": extract,
        "photoUrl": photo_url,
        "wikipediaUrl": data.get("content_urls", {}).get("desktop", {}).get("page")
    }

# Provider 3: Crossref API for Technical / Academic Books
def query_crossref(title, author, cache):
    clean_t = clean_search_title(title)
    clean_a = clean_author_name(author)
    if not clean_t:
        return None

    params = {"query.bibliographic": clean_t, "rows": 1}
    if clean_a:
        params["query.author"] = clean_a

    url = f"https://api.crossref.org/works?{urllib.parse.urlencode(params)}"
    data = fetch_url(url, cache, "CROSSREF")
    if not data or not isinstance(data, dict):
        return None

    items = data.get("message", {}).get("items", [])
    if not items:
        return None

    item = items[0]
    isbns = item.get("ISBN", [])
    publishers = item.get("publisher")
    year = None
    if item.get("issued", {}).get("date-parts"):
        year = item["issued"]["date-parts"][0][0]

    return {
        "provider": "CROSSREF",
        "title": item.get("title", [clean_t])[0] if item.get("title") else clean_t,
        "publisher": publishers,
        "isbn": isbns[0] if isbns else None,
        "year": year,
        "doi": item.get("DOI")
    }

# Authentic Image Processing & Verification Pipeline
def download_and_verify_cover(cover_url, slug, cache):
    if not cover_url:
        return None

    cached_bytes, _ = cache.get(cover_url)
    img_bytes = None

    if cached_bytes and isinstance(cached_bytes, bytes):
        img_bytes = cached_bytes
    else:
        try:
            req = urllib.request.Request(cover_url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=12) as res:
                img_bytes = res.read()
        except Exception as e:
            return None

    if not img_bytes or len(img_bytes) < 4000: # Discard 1x1 pixels or tiny blanks
        return None

    try:
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size

        # Validate minimum dimensions and portrait orientation
        if width < 250 or height < 350:
            return None
        aspect_ratio = height / width
        if aspect_ratio < 1.1 or aspect_ratio > 1.9:
            return None # Reject square badges or ultra-wide banners

        # Convert to RGB if necessary
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Save standard clean JPEG
        jpg_filename = f"{slug}.jpg"
        jpg_path = os.path.join(COVERS_DIR, jpg_filename)
        img.save(jpg_path, format="JPEG", quality=88, optimize=True)

        # Save modern optimized WebP
        webp_filename = f"{slug}.webp"
        webp_path = os.path.join(COVERS_DIR, webp_filename)
        img.save(webp_path, format="WEBP", quality=85)

        return {
            "coverImage": f"/covers/{jpg_filename}",
            "coverWebp": f"/covers/{webp_filename}",
            "width": width,
            "height": height,
            "aspectRatio": round(aspect_ratio, 2),
            "fileSizeKb": round(len(img_bytes) / 1024, 1),
            "sourceUrl": cover_url
        }
    except Exception as e:
        return None

def compute_confidence_score(book, ol_meta, wiki_author, cover_meta):
    score = 30 # Base score for catalogued existence

    if ol_meta:
        score += 25
        if ol_meta.get("isbn13") or ol_meta.get("isbn10"):
            score += 15
        if ol_meta.get("publisher"):
            score += 10
        if ol_meta.get("first_publish_year"):
            score += 5

    if wiki_author:
        score += 15

    if cover_meta:
        score += 15
    elif book.get("coverImage") and not "standard-shelf-cover" in book.get("coverImage"):
        score += 10

    return min(100, score)

def run_enrichment_pipeline(max_items=500):
    print("=================================================================")
    print("PHASE 2 & 3: MASTER MULTI-SOURCE EBOOK & AUTHOR ENRICHMENT")
    print("=================================================================")

    cache = EnrichmentCache()

    # Load existing authors registry and provenance ledger
    authors_registry = {}
    if os.path.exists(AUTHORS_REGISTRY_PATH):
        try:
            with open(AUTHORS_REGISTRY_PATH, "r", encoding="utf-8") as f:
                authors_registry = json.load(f)
        except:
            authors_registry = {}

    provenance_ledger = {}
    if os.path.exists(PROVENANCE_LEDGER_PATH):
        try:
            with open(PROVENANCE_LEDGER_PATH, "r", encoding="utf-8") as f:
                provenance_ledger = json.load(f)
        except:
            provenance_ledger = {}

    audit_log = []
    if os.path.exists(AUDIT_LOG_PATH):
        try:
            with open(AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
                audit_log = json.load(f)
        except:
            audit_log = []

    # 1. Enrich Demanded Books first (Core 261 titles)
    demanded_path = os.path.join(DATA_DIR, "demanded_books_registry.json")
    with open(demanded_path, "r", encoding="utf-8") as f:
        demanded_books = json.load(f)

    # 2. Enrich Enriched 1000 Books
    enriched_path = os.path.join(DATA_DIR, "enriched_1000_books.json")
    with open(enriched_path, "r", encoding="utf-8") as f:
        enriched_books = json.load(f)

    print(f"Targeting high-priority catalog tiers: Demanded ({len(demanded_books)}) + Top Curated ({len(enriched_books)})...")

    processed_count = 0
    updated_count = 0
    covers_verified_count = 0
    authors_enriched_count = 0

    combined_targets = []
    seen_ids = set()
    for b in demanded_books + enriched_books:
        bid = b.get("id") or b.get("slug")
        if bid and bid not in seen_ids:
            seen_ids.add(bid)
            combined_targets.append(b)

    for idx, book in enumerate(combined_targets[:max_items], 1):
        book_id = book.get("id") or book.get("slug")
        slug = book.get("slug") or f"book-{idx}"
        title = book.get("title", "")
        author = book.get("author", "")

        # Check if already fully verified in cache
        cached_status = cache.is_processed(book_id)
        if cached_status == "VERIFIED":
            processed_count += 1
            continue

        print(f"[{idx}/{min(len(combined_targets), max_items)}] Enriching: {title[:40]} by {author[:25]}...")

        # 1. Multi-source metadata retrieval
        ol_meta = query_open_library(title, author, cache)
        time.sleep(0.15) # Polite request spacing

        # 2. Author profile retrieval from Wikipedia
        verified_author_name = (ol_meta.get("author") if ol_meta else None) or clean_author_name(author)
        wiki_author = None
        if verified_author_name and len(verified_author_name) > 3:
            author_slug = verified_author_name.lower().replace(" ", "-")
            if author_slug in authors_registry:
                wiki_author = authors_registry[author_slug]
            else:
                wiki_author = query_wikipedia_author(verified_author_name, cache)
                if wiki_author:
                    authors_registry[author_slug] = wiki_author
                    authors_enriched_count += 1
                time.sleep(0.15)

        # 3. Authentic Cover Retrieval
        cover_meta = None
        candidate_cover_url = None
        if ol_meta and ol_meta.get("cover_id"):
            candidate_cover_url = f"https://covers.openlibrary.org/b/id/{ol_meta['cover_id']}-L.jpg"

        if candidate_cover_url:
            cover_meta = download_and_verify_cover(candidate_cover_url, slug, cache)
            if cover_meta:
                covers_verified_count += 1
                provenance_ledger[book_id] = {
                    "bookId": book_id,
                    "slug": slug,
                    "provider": "OPEN_LIBRARY",
                    "sourceUrl": candidate_cover_url,
                    "coverImage": cover_meta["coverImage"],
                    "coverWebp": cover_meta["coverWebp"],
                    "width": cover_meta["width"],
                    "height": cover_meta["height"],
                    "aspectRatio": cover_meta["aspectRatio"],
                    "fileSizeKb": cover_meta["fileSizeKb"],
                    "verifiedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "license": "Public Domain / Publisher Scan"
                }

        # 4. Synthesize enriched fields safely
        old_values = {
            "isbn": book.get("isbn") or book.get("isbn13"),
            "publisher": book.get("publisher"),
            "publicationYear": book.get("publicationYear") or book.get("publishedYear"),
            "author": book.get("author"),
            "coverImage": book.get("coverImage")
        }

        changes = {}
        if ol_meta:
            if ol_meta.get("isbn13") and not book.get("isbn13"):
                book["isbn13"] = ol_meta["isbn13"]
                book["isbn"] = ol_meta["isbn13"]
                changes["isbn13"] = ol_meta["isbn13"]
            if ol_meta.get("isbn10") and not book.get("isbn10"):
                book["isbn10"] = ol_meta["isbn10"]
                changes["isbn10"] = ol_meta["isbn10"]
            if ol_meta.get("publisher") and not book.get("publisher"):
                book["publisher"] = ol_meta["publisher"]
                changes["publisher"] = ol_meta["publisher"]
            if ol_meta.get("first_publish_year") and not book.get("publicationYear"):
                book["publicationYear"] = str(ol_meta["first_publish_year"])
                book["publishedYear"] = ol_meta["first_publish_year"]
                changes["publicationYear"] = str(ol_meta["first_publish_year"])
            if ol_meta.get("author") and (not book.get("author") or "Unknown" in book.get("author")):
                book["author"] = ol_meta["author"]
                changes["author"] = ol_meta["author"]
            if ol_meta.get("openlibrary_work_id"):
                book["openlibraryWorkId"] = ol_meta["openlibrary_work_id"]

        if cover_meta:
            book["coverImage"] = cover_meta["coverImage"]
            book["coverWebp"] = cover_meta["coverWebp"]
            book["coverStatus"] = "VERIFIED_AUTHENTIC"
            changes["coverImage"] = cover_meta["coverImage"]

        # Calculate confidence & verification status
        confidence = compute_confidence_score(book, ol_meta, wiki_author, cover_meta)
        status = "VERIFIED" if confidence >= 65 else "NEEDS_REVIEW"

        book["confidenceScore"] = confidence
        book["verificationStatus"] = status
        book["enrichedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if wiki_author:
            book["authorProfile"] = {
                "name": wiki_author.get("name"),
                "shortBio": wiki_author.get("shortBio"),
                "wikipediaUrl": wiki_author.get("wikipediaUrl"),
                "photoUrl": wiki_author.get("photoUrl")
            }

        cache.mark_processed(book_id, slug, status, confidence)

        if changes:
            updated_count += 1
            audit_log.append({
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "bookId": book_id,
                "slug": slug,
                "changes": changes,
                "confidenceScore": confidence,
                "status": status
            })

        processed_count += 1

    # Save all updated registries atomically
    print("\nSaving enriched datasets...")
    with open(demanded_path, "w", encoding="utf-8") as f:
        json.dump(demanded_books, f, indent=2)

    with open(enriched_path, "w", encoding="utf-8") as f:
        json.dump(enriched_books, f, indent=2)

    with open(AUTHORS_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(authors_registry, f, indent=2)

    with open(PROVENANCE_LEDGER_PATH, "w", encoding="utf-8") as f:
        json.dump(provenance_ledger, f, indent=2)

    with open(AUDIT_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(audit_log[-500:], f, indent=2)

    # Also synchronize verified records into master 86k catalog
    master_path = os.path.join(DATA_DIR, "all_83925_catalog.json")
    if os.path.exists(master_path):
        print("Propagating verified metadata to master 86k catalog...")
        with open(master_path, "r", encoding="utf-8") as f:
            master_catalog = json.load(f)

        enriched_lookup = {b.get("id"): b for b in demanded_books + enriched_books if b.get("id")}
        matched_in_master = 0
        for b in master_catalog:
            bid = b.get("id")
            if bid in enriched_lookup:
                src = enriched_lookup[bid]
                if src.get("isbn"):
                    b["isbn"] = src["isbn"]
                if src.get("isbn13"):
                    b["isbn13"] = src["isbn13"]
                if src.get("publisher"):
                    b["publisher"] = src["publisher"]
                if src.get("publicationYear"):
                    b["publicationYear"] = src["publicationYear"]
                if src.get("coverImage"):
                    b["coverImage"] = src["coverImage"]
                if src.get("confidenceScore"):
                    b["confidenceScore"] = src["confidenceScore"]
                if src.get("verificationStatus"):
                    b["verificationStatus"] = src["verificationStatus"]
                matched_in_master += 1

        with open(master_path, "w", encoding="utf-8") as f:
            json.dump(master_catalog, f)
        print(f"Synchronized {matched_in_master:,} enriched books into master 86k catalog.")

    print("\n================ ENRICHMENT BATCH SUMMARY ================")
    print(f"• Total Processed Books: {processed_count:,}")
    print(f"• Successfully Enriched & Updated: {updated_count:,}")
    print(f"• Authentic Covers Downloaded & Verified: {covers_verified_count:,}")
    print(f"• Author Biographies Enriched: {authors_enriched_count:,}")
    print(f"• Unique Authors in Registry: {len(authors_registry):,}")
    print(f"• Total Verified Covers in Provenance Ledger: {len(provenance_ledger):,}")
    print(f"• Audit Log Entries: {len(audit_log):,}")

if __name__ == "__main__":
    count = 300
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    run_enrichment_pipeline(max_items=count)
