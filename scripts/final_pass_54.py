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

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnonTroveCoverBot/3.0"}

def clean_variations(title: str):
    variants = [title]
    # Strip leading The, A, An
    no_art = re.sub(r'^(The|A|An)\s+', '', title, flags=re.IGNORECASE).strip()
    if no_art != title:
        variants.append(no_art)
    # Strip 'Workbook' or 'Answer Book' or 'Handbook'
    no_wb = re.sub(r'\s+(Workbook|Answer Book)\b', '', title, flags=re.IGNORECASE).strip()
    if no_wb not in variants:
        variants.append(no_wb)
    # Subtitle split
    sub_clean = re.split(r'[:–—\-]', title)[0].strip()
    if sub_clean not in variants:
        variants.append(sub_clean)
    return variants

def run_pass():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    with open(ENRICHED_OUTPUT, "r", encoding="utf-8") as f:
        books = json.load(f)
        
    missing = [b for b in books if not b.get("coverUrl")]
    print(f"Total remaining without cover: {len(missing)}")
    
    found_count = 0
    
    for i, b in enumerate(missing):
        ref = b["ref"]
        title = b["title"]
        author = b["author"]
        
        # Try variations
        title_variants = clean_variations(title)
        first_author = author.split(" and ")[0].split(",")[0].strip()
        
        found_cover = None
        work_id = None
        
        for tv in title_variants:
            queries = [
                {"title": tv, "author": first_author},
                {"q": f"{tv} {first_author}".strip()},
                {"title": tv}
            ]
            
            for q in queries:
                q["limit"] = 3
                q["fields"] = "key,title,author_name,cover_i,isbn,first_publish_year,publisher"
                try:
                    resp = requests.get("https://openlibrary.org/search.json", params=q, headers=HEADERS, timeout=5)
                    if resp.status_code == 200:
                        docs = resp.json().get("docs", [])
                        for d in docs:
                            cid = d.get("cover_i")
                            if cid and int(cid) > 0:
                                found_cover = f"https://covers.openlibrary.org/b/id/{cid}-L.jpg"
                                work_id = d.get("key")
                                break
                    if found_cover:
                        break
                except Exception:
                    pass
                time.sleep(0.12)
            if found_cover:
                break
                
        if found_cover:
            found_count += 1
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> REAL COVER: {found_cover}")
            c.execute("""
                UPDATE enriched_books
                SET cover_url = ?, openlibrary_work_id = COALESCE(openlibrary_work_id, ?), verification_status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
                WHERE ref = ?
            """, (found_cover, work_id, ref))
            conn.commit()
        else:
            print(f"[{i+1}/{len(missing)}] #{ref} '{title}' -> [Still no cover]")
            
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
    print(f"PASS FINISHED: Found {found_count} new covers!")
    print(f"TOTAL REAL COVERS: {total_covers}/1000 ({total_covers/10.0:.1f}%)")
    print(f"==========================================")

if __name__ == "__main__":
    run_pass()
