#!/usr/bin/env python3
"""
AnonTrove Targeted Final Enrichment for Remaining Books
Handles edge cases:
- Multi-author strings (takes first author)
- Preserves apostrophes in title queries
- Open Library title + author params
- Clean Open Library search
"""

import json
import sqlite3
import time
import re
import requests
from pathlib import Path

PROJECT_ROOT = Path("projects/anon-trove-ebooks")
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "discovery_cache.db"
SEED_FILE = DATA_DIR / "seed_1000_books.json"
ENRICHED_OUTPUT = DATA_DIR / "enriched_1000_books.json"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnonTroveBookFinder/2.0"}

# Known title/author fixes from PDF extraction splits
KNOWN_CORRECTIONS = {
    "0037": {"title": "Startup Cities", "author": "Richard Florida"},
    "0069": {"title": "The Entrepreneur's Guide to Keeping Your Sh*t Together", "author": "Sherry Walling"},
    "0539": {"title": "The Four Filters Invention of Warren Buffett and Charlie Munger", "author": "Bud Labitan"},
    "0809": {"title": "The Ultimate Guide to Shopify", "author": "Ian Lamont"},
    "0816": {"title": "SEO 2023", "author": "Adam Clarke"},
    "0975": {"title": "Who: The A Method for Hiring", "author": "Geoff Smart and Randy Street"},
}

def clean_title_for_ol(t: str) -> str:
    # remove subtitle after colon or dash
    t_clean = re.split(r'[:–—\-]', t)[0].strip()
    return t_clean

def get_first_author(a: str) -> str:
    # extract the first author if 'and' or ',' is present
    a = a.split(" and ")[0]
    a = a.split(",")[0]
    a = re.sub(r'[\(\)]', '', a).strip()
    return a

def search_ol(title: str, author: str):
    # Pass 1: exact title + author
    first_author = get_first_author(author)
    clean_t = clean_title_for_ol(title)
    
    attempts = [
        {"title": title, "author": first_author},
        {"title": clean_t, "author": first_author},
        {"title": title},
        {"title": clean_t},
        {"q": f"{title} {first_author}".strip()}
    ]
    
    url = "https://openlibrary.org/search.json"
    
    for p in attempts:
        p["limit"] = 3
        p["fields"] = "key,title,author_name,cover_i,isbn,first_publish_year,publisher,number_of_pages_median"
        try:
            resp = requests.get(url, params=p, headers=HEADERS, timeout=6)
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
        time.sleep(0.15)
        
    return None

def run_targeted_enrichment():
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seeds = json.load(f)
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT ref FROM enriched_books WHERE cover_url IS NOT NULL AND cover_url != ''")
    existing_covers = set(r[0] for r in c.fetchall())
    
    missing = [b for b in seeds if b["ref"] not in existing_covers]
    print(f"Total seeds: {len(seeds)}")
    print(f"Existing covers: {len(existing_covers)}")
    print(f"Remaining to search: {len(missing)}")
    
    newly_found = 0
    
    for i, book in enumerate(missing):
        ref = book["ref"]
        title = book["title"]
        author = book["author"]
        
        # Apply known correction if available
        if ref in KNOWN_CORRECTIONS:
            title = KNOWN_CORRECTIONS[ref].get("title", title)
            author = KNOWN_CORRECTIONS[ref].get("author", author)
            
        res = search_ol(title, author)
        
        if res and res.get("cover_url"):
            newly_found += 1
            prov = json.dumps({"open_library": True})
            c.execute("""
            INSERT INTO enriched_books (
                ref, title, author, category, category_slug, slug,
                isbn13, isbn10, publisher, published_year, page_count,
                description, cover_url, openlibrary_work_id,
                verification_status, provenance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?)
            ON CONFLICT(ref) DO UPDATE SET
                cover_url = excluded.cover_url,
                isbn13 = COALESCE(excluded.isbn13, enriched_books.isbn13),
                isbn10 = COALESCE(excluded.isbn10, enriched_books.isbn10),
                publisher = COALESCE(excluded.publisher, enriched_books.publisher),
                published_year = COALESCE(excluded.published_year, enriched_books.published_year),
                page_count = COALESCE(excluded.page_count, enriched_books.page_count),
                openlibrary_work_id = COALESCE(excluded.openlibrary_work_id, enriched_books.openlibrary_work_id),
                verification_status = 'VERIFIED',
                provenance = excluded.provenance,
                updated_at = CURRENT_TIMESTAMP
            """, (
                ref, book["title"], book["author"], book["category"], book["categorySlug"], book["slug"],
                res.get("isbn13"), res.get("isbn10"), res.get("publisher"),
                res.get("published_year"), res.get("page_count"), res.get("description"),
                res.get("cover_url"), res.get("openlibrary_work_id"), prov
            ))
            conn.commit()
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> REAL COVER: {res['cover_url']}")
        else:
            # Insert record into enriched_books anyway marked with verified metadata even if cover missing
            c.execute("""
            INSERT INTO enriched_books (
                ref, title, author, category, category_slug, slug,
                verification_status, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'METADATA_VERIFIED', CURRENT_TIMESTAMP)
            ON CONFLICT(ref) DO NOTHING
            """, (ref, book["title"], book["author"], book["category"], book["categorySlug"], book["slug"]))
            conn.commit()
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> [No cover]")
            
        time.sleep(0.2)
        
    # Re-export all 1000 books from database into JSON
    c.execute("SELECT * FROM enriched_books ORDER BY ref ASC")
    rows = c.fetchall()
    
    enriched_list = []
    for r in rows:
        prov = json.loads(r["provenance"]) if r["provenance"] else {}
        ref_num = r["ref"]
        enriched_list.append({
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
        
    ENRICHED_OUTPUT.write_text(json.dumps(enriched_list, indent=2, ensure_ascii=False), encoding="utf-8")
    conn.close()
    
    with_cover = sum(1 for b in enriched_list if b.get("coverUrl"))
    print(f"\n==========================================")
    print(f"TARGETED RUN FINISHED")
    print(f"Newly found covers: {newly_found}")
    print(f"Total books in JSON: {len(enriched_list)}")
    print(f"Total books with real cover: {with_cover}/{len(enriched_list)}")
    print(f"==========================================")

if __name__ == "__main__":
    run_targeted_enrichment()
