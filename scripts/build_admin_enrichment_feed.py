"""
Generate admin queryable enrichment feed from SQLite checkpoint database
"""

import sqlite3
import json
import os

DATA_DIR = r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks\data"
DB_PATH = os.path.join(DATA_DIR, "enrichment_86k_checkpoint.db")
FEED_PATH = os.path.join(DATA_DIR, "enrichment_86k_admin_feed.json")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get total stats
cur.execute("SELECT count(*) FROM enriched_manifest")
total = cur.fetchone()[0]

cur.execute("SELECT listing_status, count(*) FROM enriched_manifest GROUP BY listing_status")
statuses = dict(cur.fetchall())

cur.execute("SELECT cover_type, count(*) FROM enriched_manifest GROUP BY cover_type")
covers = dict(cur.fetchall())

print(f"Total: {total}")
print(f"Statuses: {statuses}")
print(f"Covers: {covers}")

# Select representative sample across all 5 statuses:
# 200 items per status (or all if < 200) to allow instant searching and browsing
items_by_status = {}
for st in ['APPROVED_FOR_SALE', 'RIGHTS_VERIFICATION_REQUIRED', 'PRICE_RESEARCH_REQUIRED', 'MANUAL_REVIEW', 'NOT_APPROVED_FOR_SALE']:
    cur.execute("""
    SELECT manifest_id, cleaned_title, cleaned_author, category, cover_url, cover_type,
           market_reference_price, market_current_price, lowest_comparable_price,
           publisher_list_price, our_selling_price, our_discount_percentage,
           price_source_url, price_verified_at, listing_status, rights_status, error_notes,
           isbn10, isbn13, publisher, pages, format, source_filename
    FROM enriched_manifest
    WHERE listing_status = ?
    ORDER BY manifest_id ASC
    LIMIT 250
    """, (st,))
    rows = [dict(r) for r in cur.fetchall()]
    items_by_status[st] = rows
    print(f"Sampled {len(rows)} items for {st}")

feed = {
    "totalRecords": total,
    "statuses": statuses,
    "covers": covers,
    "itemsByStatus": items_by_status
}

with open(FEED_PATH, "w", encoding="utf-8") as f:
    json.dump(feed, f, indent=2)

print(f"Saved admin feed to {FEED_PATH} ({os.path.getsize(FEED_PATH)} bytes)")
conn.close()
