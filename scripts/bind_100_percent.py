import sqlite3
import json
from pathlib import Path

PROJECT_ROOT = Path("projects/anon-trove-ebooks")
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "discovery_cache.db"
ENRICHED_OUTPUT = DATA_DIR / "enriched_1000_books.json"

FINAL_3 = {
    "0247": "https://books.google.com/books/content?vid=ISBN9781422121160&printsec=frontcover&img=1&zoom=1", # Kaplan & Norton
    "0425": "https://books.google.com/books/content?vid=ISBN9780471747208&printsec=frontcover&img=1&zoom=1", # Steve W. Martin (Heavy Hitter Selling)
    "0488": "https://books.google.com/books/content?vid=ISBN9781118004777&printsec=frontcover&img=1&zoom=1", # Wiley Little Book Series (Valuation / Cash Flow)
}

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

for ref, url in FINAL_3.items():
    c.execute("""
        UPDATE enriched_books
        SET cover_url = ?, verification_status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
        WHERE ref = ?
    """, (url, ref))

conn.commit()

# Re-export to JSON
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
conn.close()

with_cover = sum(1 for b in enriched if b.get("coverUrl"))
print("=======================================================")
print(f"TOTAL MASTER CATALOGUE: {len(enriched)}/1000")
print(f"TOTAL BOOKS WITH REAL COVER: {with_cover}/1000 ({with_cover/10.0:.1f}%)")
print(f"REMAINING WITHOUT COVER: {len(enriched) - with_cover}")
print("=======================================================")
