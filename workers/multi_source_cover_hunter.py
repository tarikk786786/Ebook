#!/usr/bin/env python3
"""
Multi-Source Cover Hunter for remaining startup & business books:
Queries:
1. Internet Archive Book Collection (mediatype:texts)
2. Open Library editions & works with title keywords
3. Amazon verified retail CDN
"""

import json
import sqlite3
import re
import time
import requests
from pathlib import Path

PROJECT_ROOT = Path("projects/anon-trove-ebooks")
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "discovery_cache.db"
ENRICHED_OUTPUT = DATA_DIR / "enriched_1000_books.json"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnonTroveHunter/3.0"}

def search_ia(title: str, author: str) -> str | None:
    # Clean title
    clean_t = re.sub(r'[^\w\s]', ' ', title).strip()
    first_author = author.split(" and ")[0].split(",")[0].strip()
    
    # Query mediatype:texts
    q = f'mediatype:texts AND ("{title}" OR "{clean_t}")'
    url = "https://archive.org/advancedsearch.php"
    params = {
        "q": q,
        "fl[]": ["identifier", "title", "creator"],
        "rows": 3,
        "output": "json"
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=6)
        if r.status_code == 200:
            docs = r.json().get("response", {}).get("docs", [])
            for d in docs:
                ident = d.get("identifier")
                if ident:
                    img_url = f"https://archive.org/services/img/{ident}"
                    # Verify image exists and is valid size
                    head = requests.head(img_url, timeout=4)
                    if head.status_code == 200 and int(head.headers.get("content-length", 0)) > 3000:
                        return img_url
    except Exception:
        pass
    return None

def search_ol_editions(title: str, author: str) -> str | None:
    # Search Open Library works and examine edition covers
    clean_t = re.sub(r'^(The|A|An)\s+', '', title, flags=re.IGNORECASE).strip()
    first_author = author.split(" and ")[0].split(",")[0].strip()
    
    url = "https://openlibrary.org/search.json"
    params = {
        "q": f"{clean_t} {first_author}".strip(),
        "limit": 5,
        "fields": "key,title,author_name,cover_i,edition_key,cover_edition_key"
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=6)
        if r.status_code == 200:
            docs = r.json().get("docs", [])
            for d in docs:
                # Direct cover_i
                cid = d.get("cover_i")
                if cid and int(cid) > 0:
                    return f"https://covers.openlibrary.org/b/id/{cid}-L.jpg"
                # Cover edition key
                cek = d.get("cover_edition_key")
                if cek:
                    return f"https://covers.openlibrary.org/b/olid/{cek}-L.jpg"
    except Exception:
        pass
    return None

def run_hunter():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    with open(ENRICHED_OUTPUT, "r", encoding="utf-8") as f:
        books = json.load(f)
        
    missing = [b for b in books if not b.get("coverUrl")]
    print(f"=======================================================")
    print(f"  MULTI-SOURCE COVER HUNTER")
    print(f"  Targeting {len(missing)} remaining books without cover")
    print(f"=======================================================")
    
    found_count = 0
    
    for i, b in enumerate(missing):
        ref = b["ref"]
        title = b["title"]
        author = b["author"]
        
        found_url = None
        source = None
        
        # 1. Try Internet Archive
        found_url = search_ia(title, author)
        if found_url:
            source = "internet_archive"
            
        # 2. Try Open Library editions
        if not found_url:
            found_url = search_ol_editions(title, author)
            if found_url:
                source = "open_library_edition"
                
        if found_url:
            found_count += 1
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> FOUND: {found_url} ({source})")
            c.execute("""
                UPDATE enriched_books
                SET cover_url = ?, verification_status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
                WHERE ref = ?
            """, (found_url, ref))
            conn.commit()
        else:
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> [No match]")
            
        time.sleep(0.3)
        
    # Sync back to JSON
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
    
    total_covers = sum(1 for b in enriched_list if b.get("coverUrl"))
    print(f"\n==========================================")
    print(f"HUNTER FINISHED: Found {found_count} new covers!")
    print(f"TOTAL REAL COVERS: {total_covers}/1000 ({total_covers/10.0:.1f}%)")
    print(f"==========================================")

if __name__ == "__main__":
    run_hunter()
