import sqlite3
import csv
import sys
import time
import os

DB_PATH = "data/master_manifest_pipeline.db"
CSV_PATH = "data/ebook_all_86260_link_directory.csv"

def ingest_research_links():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS manifest_research_links (
        manifest_id INTEGER PRIMARY KEY,
        google_books_url TEXT,
        open_library_url TEXT,
        crossref_url TEXT,
        google_images_url TEXT,
        wikimedia_url TEXT,
        author_google_url TEXT,
        author_wikipedia_url TEXT,
        internet_archive_url TEXT,
        gutenberg_url TEXT,
        amazon_in_url TEXT,
        google_play_url TEXT,
        publisher_search_url TEXT,
        link_status TEXT
    )
    """)

    cur.execute("SELECT COUNT(*) FROM manifest_research_links")
    count = cur.fetchone()[0]
    if count == 86260:
        print("manifest_research_links already fully populated with 86,260 records!")
        conn.close()
        return

    print("Reading CSV and inserting into SQLite...")
    start_time = time.time()
    batch = []
    
    with open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = [c.lstrip('\ufeff') for c in next(reader)]
        
        for i, row in enumerate(reader, 1):
            if len(row) < 18:
                continue
            manifest_id = int(row[0])
            gb_url = row[5]
            ol_url = row[6]
            cr_url = row[7]
            gi_url = row[8]
            wm_url = row[9]
            ag_url = row[10]
            aw_url = row[11]
            ia_url = row[12]
            pg_url = row[13]
            amz_url = row[14]
            gp_url = row[15]
            pub_url = row[16]
            status = row[17]

            batch.append((
                manifest_id, gb_url, ol_url, cr_url, gi_url, wm_url,
                ag_url, aw_url, ia_url, pg_url, amz_url, gp_url, pub_url, status
            ))

            if len(batch) >= 10000:
                cur.executemany("""
                INSERT OR REPLACE INTO manifest_research_links VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, batch)
                conn.commit()
                batch = []
                print(f"  Ingested {i}/86260 records...")

    if batch:
        cur.executemany("""
        INSERT OR REPLACE INTO manifest_research_links VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, batch)
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM manifest_research_links")
    final_count = cur.fetchone()[0]
    elapsed = time.time() - start_time
    print(f"Finished! Total research link records in database: {final_count} in {elapsed:.2f}s")
    conn.close()

if __name__ == "__main__":
    ingest_research_links()
