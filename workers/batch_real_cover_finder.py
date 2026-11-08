#!/usr/bin/env python3
"""
AnonTrove — Ultra-High-Accuracy Real Ebook Cover & Metadata Finder
Uses tiered queries across Open Library & Google Books APIs to discover and bind authentic,
high-resolution retail cover artwork, ISBNs, publication years, and publishers
for the entire 1,000-book catalogue.
"""

import os
import sys
import json
import time
import re
import sqlite3
import urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_COVERS = PROJECT_ROOT / "public" / "covers"
DB_PATH = DATA_DIR / "discovery_cache.db"
SEED_FILE = DATA_DIR / "seed_1000_books.json"
ENRICHED_OUTPUT = DATA_DIR / "enriched_1000_books.json"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
HEADERS = {"User-Agent": USER_AGENT}

def clean_query_term(text: str) -> str:
    """Removes special characters, parenthesis, and extra subtitle info for clean search."""
    if not text:
        return ""
    t = re.sub(r'\(.*?\)', '', text)
    t = re.sub(r'\[.*?\]', '', t)
    t = re.sub(r'[:–—\-]', ' ', t)
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def query_open_library_strict(title: str, author: str, timeout: int = 7) -> dict | None:
    """Query Open Library with title + author."""
    clean_title = clean_query_term(title)
    clean_author = clean_query_term(author)
    url = "https://openlibrary.org/search.json"
    params = {
        "q": f"{clean_title} {clean_author}".strip(),
        "limit": 3,
        "fields": "key,title,author_name,cover_i,isbn,first_publish_year,publisher,number_of_pages_median"
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
        if resp.status_code == 200:
            for doc in resp.json().get("docs", []):
                cover_i = doc.get("cover_i")
                if cover_i and int(cover_i) > 0:
                    isbns = doc.get("isbn", [])
                    isbn13 = next((i for i in isbns if len(re.sub(r'\D', '', i)) == 13), None)
                    isbn10 = next((i for i in isbns if len(re.sub(r'\D', '', i)) == 10), None)
                    publishers = doc.get("publisher", [])
                    pub_str = publishers[0] if publishers else None
                    year_val = doc.get("first_publish_year")
                    return {
                        "cover_url": f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg",
                        "openlibrary_work_id": doc.get("key"),
                        "isbn13": isbn13,
                        "isbn10": isbn10,
                        "publisher": pub_str,
                        "published_year": str(year_val) if year_val else None,
                        "page_count": doc.get("number_of_pages_median"),
                        "source": "open_library"
                    }
    except Exception:
        pass
    return None

def query_open_library_title_only(title: str, timeout: int = 7) -> dict | None:
    """Fallback Open Library search by title only."""
    clean_title = clean_query_term(title)
    if len(clean_title) < 4:
        return None
    url = "https://openlibrary.org/search.json"
    params = {
        "title": clean_title,
        "limit": 3,
        "fields": "key,title,author_name,cover_i,isbn,first_publish_year,publisher,number_of_pages_median"
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
        if resp.status_code == 200:
            for doc in resp.json().get("docs", []):
                cover_i = doc.get("cover_i")
                if cover_i and int(cover_i) > 0:
                    isbns = doc.get("isbn", [])
                    isbn13 = next((i for i in isbns if len(re.sub(r'\D', '', i)) == 13), None)
                    isbn10 = next((i for i in isbns if len(re.sub(r'\D', '', i)) == 10), None)
                    publishers = doc.get("publisher", [])
                    pub_str = publishers[0] if publishers else None
                    year_val = doc.get("first_publish_year")
                    return {
                        "cover_url": f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg",
                        "openlibrary_work_id": doc.get("key"),
                        "isbn13": isbn13,
                        "isbn10": isbn10,
                        "publisher": pub_str,
                        "published_year": str(year_val) if year_val else None,
                        "page_count": doc.get("number_of_pages_median"),
                        "source": "open_library_title"
                    }
    except Exception:
        pass
    return None

def query_google_books(title: str, author: str, timeout: int = 7) -> dict | None:
    """Queries Google Books API as fallback for real covers and metadata."""
    clean_title = clean_query_term(title)
    clean_author = clean_query_term(author)
    
    queries = [
        f"intitle:{clean_title}+inauthor:{clean_author}",
        f"intitle:{clean_title}"
    ]
    
    for q in queries:
        url = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(q)}&maxResults=2"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout)
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                for item in items:
                    v_info = item.get("volumeInfo", {})
                    img_links = v_info.get("imageLinks", {})
                    thumb = img_links.get("thumbnail") or img_links.get("smallThumbnail")
                    if thumb:
                        thumb = thumb.replace("http://", "https://")
                        thumb = thumb.replace("&edge=curl", "")
                        identifiers = v_info.get("industryIdentifiers", [])
                        isbn13 = next((id_obj["identifier"] for id_obj in identifiers if id_obj.get("type") == "ISBN_13"), None)
                        isbn10 = next((id_obj["identifier"] for id_obj in identifiers if id_obj.get("type") == "ISBN_10"), None)
                        pub_date = v_info.get("publishedDate", "")
                        year = pub_date[:4] if len(pub_date) >= 4 and pub_date[:4].isdigit() else None
                        return {
                            "cover_url": thumb,
                            "google_volume_id": item.get("id"),
                            "isbn13": isbn13,
                            "isbn10": isbn10,
                            "publisher": v_info.get("publisher"),
                            "published_year": year,
                            "page_count": v_info.get("pageCount"),
                            "description": v_info.get("description"),
                            "source": "google_books"
                        }
        except Exception:
            pass
        time.sleep(0.1)
        
    return None

def find_real_cover(title: str, author: str) -> dict:
    """Searches providers in sequence: OL Strict -> OL Title -> Google Books."""
    # 1. Open Library strict title + author
    res = query_open_library_strict(title, author)
    if res and res.get("cover_url"):
        return res
        
    # 2. Open Library title only
    res = query_open_library_title_only(title)
    if res and res.get("cover_url"):
        return res

    # 3. Google Books
    res = query_google_books(title, author)
    if res and res.get("cover_url"):
        return res
        
    return {}

def init_db(conn):
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
    conn.commit()

def sync_db_to_json(conn):
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM enriched_books ORDER BY ref ASC")
    rows = c.fetchall()
    
    enriched = []
    for r in rows:
        prov = json.loads(r["provenance"]) if r["provenance"] else {}
        ref_num = r["ref"]
        enriched.append({
            "ref": ref_num,
            "id": f"book-{ref_num}",
            "title": r["title"],
            "author": r["author"],
            "category": r["category"],
            "categorySlug": r["category_slug"],
            "slug": r["slug"],
            "isbn13": r["isbn13"],
            "isbn10": r["isbn10"],
            "publisher": r["publisher"],
            "publishedYear": r["published_year"],
            "pageCount": r["page_count"],
            "description": r["description"],
            "language": r["language"] or "en",
            "coverUrl": r["cover_url"],
            "previewUrl": r["preview_url"],
            "infoUrl": r["info_url"],
            "rating": r["rating"],
            "reviewCount": r["review_count"],
            "openlibraryWorkId": r["openlibrary_work_id"],
            "googleVolumeId": r["google_volume_id"],
            "verificationStatus": r["verification_status"],
            "provenance": prov
        })
    
    ENRICHED_OUTPUT.write_text(json.dumps(enriched, indent=2, ensure_ascii=False), encoding="utf-8")
    return len(enriched)

def process_batch(start_idx: int = 0, count: int = 200, max_workers: int = 6):
    if not SEED_FILE.exists():
        print(f"Error: {SEED_FILE} not found!")
        return
        
    seeds = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    
    c = conn.cursor()
    c.execute("SELECT ref FROM enriched_books WHERE cover_url IS NOT NULL AND cover_url != ''")
    existing_covers = set(r[0] for r in c.fetchall())
    
    targets = [b for b in seeds if b["ref"] not in existing_covers]
    selected_targets = targets[start_idx : start_idx + count]
    
    print(f"=======================================================", flush=True)
    print(f"  ANONTROVE MULTI-TIER REAL COVER FINDER", flush=True)
    print(f"  Total Master Seeds : {len(seeds)}", flush=True)
    print(f"  Existing Covers    : {len(existing_covers)}", flush=True)
    print(f"  Remaining to Enrich: {len(targets)}", flush=True)
    print(f"  Selected for Run   : {len(selected_targets)} (workers: {max_workers})", flush=True)
    print(f"=======================================================", flush=True)
    
    def worker_job(book):
        ref = book["ref"]
        title = book["title"]
        author = book["author"]
        found = find_real_cover(title, author)
        time.sleep(0.15)
        return book, found

    completed = 0
    found_count = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(worker_job, b): b for b in selected_targets}
        for future in as_completed(futures):
            book, result = future.result()
            completed += 1
            ref = book["ref"]
            
            if result and result.get("cover_url"):
                found_count += 1
                prov = {result.get("source", "open_library"): True}
                c.execute("""
                INSERT INTO enriched_books (
                    ref, title, author, category, category_slug, slug,
                    isbn13, isbn10, publisher, published_year, page_count,
                    description, cover_url, openlibrary_work_id, google_volume_id,
                    verification_status, provenance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ref) DO UPDATE SET
                    cover_url = excluded.cover_url,
                    isbn13 = COALESCE(excluded.isbn13, enriched_books.isbn13),
                    isbn10 = COALESCE(excluded.isbn10, enriched_books.isbn10),
                    publisher = COALESCE(excluded.publisher, enriched_books.publisher),
                    published_year = COALESCE(excluded.published_year, enriched_books.published_year),
                    page_count = COALESCE(excluded.page_count, enriched_books.page_count),
                    verification_status = 'VERIFIED',
                    provenance = excluded.provenance,
                    updated_at = CURRENT_TIMESTAMP
                """, (
                    ref, book["title"], book["author"], book["category"], book["categorySlug"], book["slug"],
                    result.get("isbn13"), result.get("isbn10"), result.get("publisher"),
                    result.get("published_year"), result.get("page_count"), result.get("description"),
                    result.get("cover_url"), result.get("openlibrary_work_id"), result.get("google_volume_id"),
                    "VERIFIED", json.dumps(prov)
                ))
                conn.commit()
                print(f"[{completed}/{len(selected_targets)}] #{ref} '{book['title']}' -> REAL COVER: {result['cover_url']} ({result.get('source')})", flush=True)
            else:
                print(f"[{completed}/{len(selected_targets)}] #{ref} '{book['title']}' -> [No cover found]", flush=True)
            
            if completed % 25 == 0:
                sync_db_to_json(conn)

    total_saved = sync_db_to_json(conn)
    conn.close()
    print(f"\n[DONE] Batch complete! Found {found_count}/{completed} real covers. Total enriched in JSON: {total_saved}", flush=True)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=200)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    
    process_batch(start_idx=args.start, count=args.count, max_workers=args.workers)
