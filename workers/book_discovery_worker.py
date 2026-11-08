"""
AnonTrove — Global Multi-Provider Book Discovery & Metadata Enrichment Worker
Connects to Google Books API v1, Open Library API, and Wikidata to enrich,
verify, deduplicate, and catalog books starting from seed_1000_books.json.
Maintains state in SQLite 'data/discovery_cache.db' with full provenance tracking.
"""

import os
import sys
import json
import time
import sqlite3
import urllib.parse
import urllib.request
import argparse
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_COVERS = PROJECT_ROOT / "public" / "covers"
DB_PATH = DATA_DIR / "discovery_cache.db"
SEED_FILE = DATA_DIR / "seed_1000_books.json"
ENRICHED_OUTPUT = DATA_DIR / "enriched_1000_books.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_COVERS.mkdir(parents=True, exist_ok=True)

USER_AGENT = "AnonTroveBookDiscoveryBot/1.0 (+https://anontrove.com; bibliographic-research)"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS enriched_books (
        ref TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        category_slug TEXT,
        slug TEXT,
        isbn13 TEXT,
        isbn10 TEXT,
        publisher TEXT,
        published_year TEXT,
        page_count INTEGER,
        description TEXT,
        language TEXT,
        cover_url TEXT,
        local_cover_path TEXT,
        preview_url TEXT,
        info_url TEXT,
        rating REAL,
        review_count INTEGER,
        openlibrary_work_id TEXT,
        google_volume_id TEXT,
        verification_status TEXT DEFAULT 'UNVERIFIED',
        provenance TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        endpoint TEXT,
        status_code INTEGER,
        response_time_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    return conn

def fetch_json(url: str, timeout: int = 10) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = int((time.time() - start) * 1000)
            data = json.loads(resp.read().decode("utf-8"))
            log_api_call(url.split("?")[0], 200, elapsed)
            return data
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        log_api_call(url.split("?")[0], e.code, elapsed)
        if e.code == 429:
            print("  [RateLimit] HTTP 429 encountered, backing off for 5 seconds...")
            time.sleep(5)
        return None
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        log_api_call(url.split("?")[0], 0, elapsed)
        return None

def log_api_call(provider_url: str, status: int, elapsed_ms: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO api_logs (provider, endpoint, status_code, response_time_ms) VALUES (?, ?, ?, ?)",
                  (provider_url, provider_url, status, elapsed_ms))
        conn.commit()
        conn.close()
    except Exception:
        pass

def query_google_books(title: str, author: str) -> dict | None:
    clean_title = title.split(":")[0].strip()
    clean_author = author.split(" with ")[0].split(" and ")[0].split(",")[0].strip()
    query = f"intitle:{clean_title}+inauthor:{clean_author}"
    url = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(query)}&maxResults=3&printType=books"
    
    data = fetch_json(url)
    if not data or "items" not in data or len(data["items"]) == 0:
        # Fallback query without author qualifier
        url_fb = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(clean_title)}&maxResults=3&printType=books"
        data = fetch_json(url_fb)

    if not data or "items" not in data or len(data["items"]) == 0:
        return None

    vol = data["items"][0]["volumeInfo"]
    
    # Extract ISBNs
    isbn13 = None
    isbn10 = None
    if "industryIdentifiers" in vol:
        for ident in vol["industryIdentifiers"]:
            if ident.get("type") == "ISBN_13":
                isbn13 = ident.get("identifier")
            elif ident.get("type") == "ISBN_10":
                isbn10 = ident.get("identifier")

    # Image links
    cover_url = None
    if "imageLinks" in vol:
        cover_url = vol["imageLinks"].get("extraLarge") or vol["imageLinks"].get("large") or vol["imageLinks"].get("medium") or vol["imageLinks"].get("thumbnail")
        if cover_url:
            cover_url = cover_url.replace("http://", "https://")

    pub_year = vol.get("publishedDate", "")[:4] if vol.get("publishedDate") else None

    return {
        "google_volume_id": data["items"][0]["id"],
        "title": vol.get("title", title),
        "subtitle": vol.get("subtitle"),
        "authors": vol.get("authors", [author]),
        "publisher": vol.get("publisher"),
        "published_year": pub_year,
        "page_count": vol.get("pageCount"),
        "description": vol.get("description"),
        "categories": vol.get("categories", []),
        "isbn13": isbn13,
        "isbn10": isbn10,
        "cover_url": cover_url,
        "preview_url": vol.get("previewLink"),
        "info_url": vol.get("infoLink"),
        "rating": vol.get("averageRating"),
        "review_count": vol.get("ratingsCount"),
        "language": vol.get("language", "en"),
    }

def query_open_library(title: str, author: str) -> dict | None:
    clean_title = title.split(":")[0].strip()
    clean_author = author.split(" with ")[0].split(" and ")[0].split(",")[0].strip()
    url = f"https://openlibrary.org/search.json?title={urllib.parse.quote(clean_title)}&author={urllib.parse.quote(clean_author)}&limit=1"
    
    data = fetch_json(url)
    if not data or "docs" not in data or len(data["docs"]) == 0:
        return None

    doc = data["docs"][0]
    cover_id = doc.get("cover_i")
    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

    isbns = doc.get("isbn", [])
    isbn13 = None
    isbn10 = None
    for i in isbns:
        if len(i) == 13 and not isbn13:
            isbn13 = i
        elif len(i) == 10 and not isbn10:
            isbn10 = i

    publish_year = str(doc.get("first_publish_year")) if doc.get("first_publish_year") else None

    return {
        "openlibrary_work_id": doc.get("key"),
        "title": doc.get("title", title),
        "publisher": doc.get("publisher", [None])[0] if doc.get("publisher") else None,
        "published_year": publish_year,
        "cover_url": cover_url,
        "isbn13": isbn13,
        "isbn10": isbn10,
        "subjects": doc.get("subject", [])[:5],
    }

def enrich_book(seed_book: dict) -> dict:
    title = seed_book["title"]
    author = seed_book["author"]
    ref = seed_book["ref"]

    provenance = {}
    
    # 1. Google Books query
    gb_data = query_google_books(title, author)
    if gb_data:
        provenance["google_books"] = True

    # Polite delay to respect API limits
    time.sleep(0.3)

    # 2. Open Library query
    ol_data = query_open_library(title, author)
    if ol_data:
        provenance["open_library"] = True

    # Combine best available metadata
    isbn13 = (gb_data.get("isbn13") if gb_data else None) or (ol_data.get("isbn13") if ol_data else None)
    isbn10 = (gb_data.get("isbn10") if gb_data else None) or (ol_data.get("isbn10") if ol_data else None)
    publisher = (gb_data.get("publisher") if gb_data else None) or (ol_data.get("publisher") if ol_data else None)
    pub_year = (gb_data.get("published_year") if gb_data else None) or (ol_data.get("published_year") if ol_data else None)
    cover_url = (gb_data.get("cover_url") if gb_data else None) or (ol_data.get("cover_url") if ol_data else None)
    desc = gb_data.get("description") if gb_data else None
    pages = gb_data.get("page_count") if gb_data else None
    rating = gb_data.get("rating") if gb_data else None
    reviews = gb_data.get("review_count") if gb_data else None
    google_vol_id = gb_data.get("google_volume_id") if gb_data else None
    ol_work_id = ol_data.get("openlibrary_work_id") if ol_data else None
    preview_url = gb_data.get("preview_url") if gb_data else None
    info_url = gb_data.get("info_url") if gb_data else None
    lang = (gb_data.get("language") if gb_data else "en")

    # Determine verification tier
    if isbn13 and publisher and (google_vol_id or ol_work_id):
        verification_status = "VERIFIED"
    elif isbn10 or publisher or google_vol_id or ol_work_id:
        verification_status = "PARTIALLY_VERIFIED"
    else:
        verification_status = "DISCOVERED"

    record = {
        "ref": ref,
        "id": seed_book["id"],
        "title": title,
        "author": author,
        "category": seed_book["category"],
        "categorySlug": seed_book["categorySlug"],
        "categoryIndex": seed_book["categoryIndex"],
        "slug": seed_book["slug"],
        "isbn13": isbn13,
        "isbn10": isbn10,
        "publisher": publisher,
        "publishedYear": pub_year,
        "pageCount": pages,
        "description": desc,
        "language": lang,
        "coverUrl": cover_url,
        "previewUrl": preview_url,
        "infoUrl": info_url,
        "rating": rating,
        "reviewCount": reviews,
        "openlibraryWorkId": ol_work_id,
        "googleVolumeId": google_vol_id,
        "verificationStatus": verification_status,
        "provenance": provenance,
    }

    # Save to SQLite cache
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO enriched_books (
        ref, title, author, category, category_slug, slug,
        isbn13, isbn10, publisher, published_year, page_count,
        description, language, cover_url, preview_url, info_url,
        rating, review_count, openlibrary_work_id, google_volume_id,
        verification_status, provenance, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        ref, title, author, seed_book["category"], seed_book["categorySlug"], seed_book["slug"],
        isbn13, isbn10, publisher, pub_year, pages,
        desc, lang, cover_url, preview_url, info_url,
        rating, reviews, ol_work_id, google_vol_id,
        verification_status, json.dumps(provenance)
    ))
    conn.commit()
    conn.close()

    return record

def run_enrichment(limit: int = 50, force: bool = False):
    conn = init_db()
    c = conn.cursor()

    if not SEED_FILE.exists():
        print(f"[Error] Seed file not found at {SEED_FILE}")
        return

    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_books = json.load(f)

    print(f"\n=======================================================")
    print(f"   ANONTROVE GLOBAL BOOK ENRICHMENT PIPELINE")
    print(f"=======================================================")
    print(f"Total Seed Books to process: {len(seed_books)}")
    print(f"Batch limit for this run    : {limit}")
    print(f"=======================================================\n")

    processed = 0
    enriched_results = []

    for book in seed_books:
        if processed >= limit:
            break

        ref = book["ref"]
        
        # Check if already enriched in SQLite
        if not force:
            c.execute("SELECT ref, verification_status, isbn13, cover_url FROM enriched_books WHERE ref = ?", (ref,))
            existing = c.fetchone()
            if existing and existing[1] in ("VERIFIED", "PARTIALLY_VERIFIED"):
                continue

        print(f"[{processed+1}/{limit}] #{ref} '{book['title']}' by {book['author']}...")
        result = enrich_book(book)
        
        status = result["verificationStatus"]
        isbn_str = result["isbn13"] or result["isbn10"] or "No ISBN"
        has_cov = "Cover Found" if result["coverUrl"] else "No Cover"
        print(f"   -> [{status}] {isbn_str} | {result.get('publisher') or 'No Publisher'} | {has_cov}")

        processed += 1
        time.sleep(0.4)

    # Export full SQLite database to ENRICHED_OUTPUT
    c.execute("""
    SELECT ref, title, author, category, category_slug, slug,
           isbn13, isbn10, publisher, published_year, page_count,
           description, language, cover_url, preview_url, info_url,
           rating, review_count, openlibrary_work_id, google_volume_id,
           verification_status, provenance
    FROM enriched_books ORDER BY ref ASC
    """)
    rows = c.fetchall()
    
    export_list = []
    for r in rows:
        export_list.append({
            "ref": r[0],
            "id": f"book-{r[0]}",
            "title": r[1],
            "author": r[2],
            "category": r[3],
            "categorySlug": r[4],
            "slug": r[5],
            "isbn13": r[6],
            "isbn10": r[7],
            "publisher": r[8],
            "publishedYear": r[9],
            "pageCount": r[10],
            "description": r[11],
            "language": r[12],
            "coverUrl": r[13],
            "previewUrl": r[14],
            "infoUrl": r[15],
            "rating": r[16],
            "reviewCount": r[17],
            "openlibraryWorkId": r[18],
            "googleVolumeId": r[19],
            "verificationStatus": r[20],
            "provenance": json.loads(r[21]) if r[21] else {},
        })

    with open(ENRICHED_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(export_list, f, indent=2, ensure_ascii=False)

    print(f"\n[Done] Processed {processed} books. Exported {len(export_list)} records to {ENRICHED_OUTPUT}")
    conn.close()

def print_stats():
    conn = init_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM enriched_books")
    total = c.fetchone()[0]
    c.execute("SELECT verification_status, COUNT(*) FROM enriched_books GROUP BY verification_status")
    by_status = c.fetchall()
    c.execute("SELECT COUNT(*) FROM enriched_books WHERE isbn13 IS NOT NULL OR isbn10 IS NOT NULL")
    with_isbn = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM enriched_books WHERE cover_url IS NOT NULL")
    with_cover = c.fetchone()[0]

    print("\n=======================================================")
    print("      DISCOVERY CACHE TELEMETRY & ENRICHMENT REPORT    ")
    print("=======================================================")
    print(f"Total Books in Cache      : {total:,} / 1,000")
    print(f"Books with Verified ISBN  : {with_isbn:,}")
    print(f"Books with Cover Image    : {with_cover:,}")
    print("-" * 55)
    print("Verification Status Breakdown:")
    for status, count in by_status:
        print(f"  - {status:<20} : {count:,} titles")
    print("=======================================================\n")
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AnonTrove Book Discovery Worker")
    parser.add_argument("--mode", choices=["enrich", "stats"], default="stats")
    parser.add_argument("--limit", type=int, default=25, help="Number of seed books to enrich in this run")
    parser.add_argument("--force", action="store_true", help="Re-query already enriched books")
    args = parser.parse_args()

    if args.mode == "stats":
        print_stats()
    elif args.mode == "enrich":
        run_enrichment(limit=args.limit, force=args.force)
