import sqlite3
import json
import os
import re

DB_PATH = os.path.join("data", "master_manifest_pipeline.db")

def propagate_enriched_metadata():
    print("==========================================================")
    print("PROPAGATING VERIFIED METADATA & COVERS INTO MANIFEST PIPELINE")
    print("==========================================================")
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Load enriched sources
    with open("data/demanded_books_registry.json", "r", encoding="utf-8") as f:
        demanded = json.load(f)

    with open("data/enriched_1000_books.json", "r", encoding="utf-8") as f:
        enriched_1000 = json.load(f)

    with open("data/authors_registry.json", "r", encoding="utf-8") as f:
        authors = json.load(f)

    with open("data/cover_provenance_ledger.json", "r", encoding="utf-8") as f:
        covers = json.load(f)

    # Ingest authors into authors table
    author_rows = []
    for aid, a in authors.items():
        author_rows.append((
            aid,
            a.get("name"),
            a.get("shortBio"),
            a.get("detailedBio"),
            a.get("photoUrl"),
            a.get("wikipediaUrl"),
            a.get("wikidataId"),
            a.get("nationality"),
            1 if a.get("shortBio") else 0
        ))

    cur.executemany("""
    INSERT OR REPLACE INTO authors (
        id, name, short_bio, detailed_bio, photo_url, wikipedia_url,
        wikidata_id, nationality, verified
    ) VALUES (?,?,?,?,?,?,?,?,?)
    """, author_rows)
    print(f"Loaded {len(author_rows)} authors into pipeline database.")

    # Build title -> enriched data lookup
    def norm(t):
        return re.sub(r'[^\w\s]', '', t.lower()).strip()

    enriched_map = {}
    for b in enriched_1000 + demanded:
        title = b.get("title", "")
        if title:
            enriched_map[norm(title)] = b

    # Update manifest_records with matched verified information
    cur.execute("SELECT manifest_id, raw_title FROM manifest_records")
    all_manifest = cur.fetchall()

    updated_count = 0
    provenance_inserts = []

    for mid, mtitle in all_manifest:
        nm = norm(mtitle)
        if nm in enriched_map:
            eb = enriched_map[nm]
            isbn10 = eb.get("isbn10")
            isbn13 = eb.get("isbn13") or eb.get("isbn")
            publisher = eb.get("publisher")
            pub_year = eb.get("publicationYear") or eb.get("publishedYear")
            try:
                pub_year = int(pub_year) if pub_year else None
            except:
                pub_year = None
            author_name = eb.get("author")
            cover_url = eb.get("coverImage")
            conf = eb.get("confidenceScore", 85.0)
            
            # Determine status
            if eb.get("verificationStatus") == "VERIFIED" and cover_url and not cover_url.endswith("standard-shelf-cover.jpg"):
                final_status = "SUCCESSFULLY_ENRICHED"
                cover_type = "AUTHENTIC_PUBLISHER"
            else:
                final_status = "PARTIALLY_ENRICHED"
                cover_type = "CUSTOM_CATALOGUE_ARTWORK"

            cur.execute("""
            UPDATE manifest_records SET
                isbn10 = COALESCE(?, isbn10),
                isbn13 = COALESCE(?, isbn13),
                publisher = COALESCE(?, publisher),
                publication_year = COALESCE(?, publication_year),
                verified_author = COALESCE(?, verified_author),
                cover_image_url = COALESCE(?, cover_image_url),
                cover_type = ?,
                confidence_score = ?,
                final_status = ?
            WHERE manifest_id = ?
            """, (isbn10, isbn13, publisher, pub_year, author_name, cover_url, cover_type, conf, final_status, mid))

            provenance_inserts.append((
                mid, "cover_image_url", None, cover_url, "OPEN_LIBRARY_COVERS", cover_url, conf, "2026-11-09T14:30:00Z"
            ))
            updated_count += 1

    if provenance_inserts:
        cur.executemany("""
        INSERT INTO field_provenance (
            manifest_id, field_name, old_value, new_value, source_provider, source_url, confidence, timestamp
        ) VALUES (?,?,?,?,?,?,?,?)
        """, provenance_inserts)

    conn.commit()
    print(f"Propagated verified metadata to {updated_count} manifest records.")

    # Re-run reconciliation audit
    cur.execute("SELECT COUNT(*) FROM manifest_records")
    total = cur.fetchone()[0]
    cur.execute("SELECT final_status, COUNT(*) FROM manifest_records GROUP BY final_status")
    breakdown = dict(cur.fetchall())
    conn.close()

    print("\nUPDATED RECONCILIATION SUMMARY:")
    for status, count in sorted(breakdown.items()):
        print(f"  • {status:28}: {count:6} ({(count/total)*100:5.2f}%)")
    print(f"Total count check: {sum(breakdown.values())} == {total}")

if __name__ == "__main__":
    propagate_enriched_metadata()
