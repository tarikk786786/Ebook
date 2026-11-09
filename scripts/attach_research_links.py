import sqlite3
import json
import re

DB_PATH = "data/master_manifest_pipeline.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Create a normalized title -> research links mapping
cur.execute("""
SELECT m.raw_title, l.google_books_url, l.open_library_url, l.crossref_url,
       l.google_images_url, l.wikimedia_url, l.author_wikipedia_url,
       l.internet_archive_url, l.gutenberg_url, l.amazon_in_url, l.google_play_url
FROM manifest_records m
JOIN manifest_research_links l ON m.manifest_id = l.manifest_id
""")

def norm(t):
    return re.sub(r'[^\w\s]', '', t.lower()).strip()

title_to_links = {}
for row in cur.fetchall():
    t = row[0]
    n = norm(t)
    if n not in title_to_links:
        title_to_links[n] = {
            "googleBooks": row[1],
            "openLibrary": row[2],
            "crossref": row[3],
            "googleImages": row[4],
            "wikimedia": row[5],
            "wikipedia": row[6],
            "internetArchive": row[7],
            "gutenberg": row[8],
            "amazon": row[9],
            "googlePlay": row[10]
        }

print(f"Loaded {len(title_to_links)} unique title lookup sets from pipeline database.")

# Update demanded_books_registry.json
with open("data/demanded_books_registry.json", "r", encoding="utf-8") as f:
    demanded = json.load(f)

matched_demanded = 0
for b in demanded:
    t = b.get("title", "")
    n = norm(t)
    if n in title_to_links:
        b["researchLinks"] = title_to_links[n]
        matched_demanded += 1

with open("data/demanded_books_registry.json", "w", encoding="utf-8") as f:
    json.dump(demanded, f, indent=2)

print(f"Updated demanded books registry: {matched_demanded}/{len(demanded)} matched research links.")

# Update enriched_1000_books.json
with open("data/enriched_1000_books.json", "r", encoding="utf-8") as f:
    enriched = json.load(f)

matched_enriched = 0
for b in enriched:
    t = b.get("title", "")
    n = norm(t)
    if n in title_to_links:
        b["researchLinks"] = title_to_links[n]
        matched_enriched += 1

with open("data/enriched_1000_books.json", "w", encoding="utf-8") as f:
    json.dump(enriched, f, indent=2)

print(f"Updated enriched 1000 books registry: {matched_enriched}/{len(enriched)} matched research links.")

conn.close()
