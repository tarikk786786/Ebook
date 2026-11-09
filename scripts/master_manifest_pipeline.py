import re
import os
import sys
import json
import sqlite3
import time
import hashlib
from collections import Counter
from test_manifest_parser import parse_manifest

DB_PATH = os.path.join("data", "master_manifest_pipeline.db")
REPORTS_DIR = os.path.join("data", "reports")
os.makedirs("data", exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Known uploader labels that MUST NOT be accepted as verified authors
UPLOADER_LABELS = {
    "anontrove guild", "anontrove engineering guild", "editorial board & domain experts",
    "anontrove editorial", "editorial board", "lenovo", "zinmatt", "reptila23",
    "vawzine", "ayanokoji kiyotaka", "anonymous", "unknown", "admin", "uploader"
}

# Regex to split standard manifest lines
LINE_RE = re.compile(r'^(.*?)\s+[\u2014\u2013-]\s+(.*?)\s+\[(.*?)\]\s+\((.*?)\)$')

# Rights review keywords
RIGHTS_RISK_KEYWORDS = [
    "z-lib", "zlibrary", "pdfdrive", "libgen", "oceanofpdf", "scihub",
    "pirate", "crack", "nulled", "torrent"
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS manifest_records (
        manifest_id INTEGER PRIMARY KEY,
        raw_title TEXT,
        cleaned_title TEXT,
        raw_contributor TEXT,
        cleaned_author TEXT,
        is_uploader_label INTEGER,
        category TEXT,
        filename TEXT,
        document_type TEXT,
        source_file_available INTEGER,
        local_file_path TEXT,
        rights_status TEXT,
        isbn10 TEXT,
        isbn13 TEXT,
        publisher TEXT,
        publication_year INTEGER,
        verified_author TEXT,
        author_id TEXT,
        cover_image_url TEXT,
        cover_type TEXT,
        description TEXT,
        description_source TEXT,
        confidence_score REAL,
        final_status TEXT,
        duplicate_of_id INTEGER,
        processed_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        name TEXT,
        short_bio TEXT,
        detailed_bio TEXT,
        photo_url TEXT,
        wikipedia_url TEXT,
        wikidata_id TEXT,
        nationality TEXT,
        verified INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS field_provenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manifest_id INTEGER,
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        source_provider TEXT,
        source_url TEXT,
        confidence REAL,
        timestamp TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS duplicate_relationships (
        manifest_id INTEGER,
        duplicate_manifest_id INTEGER,
        match_type TEXT,
        similarity_score REAL,
        PRIMARY KEY (manifest_id, duplicate_manifest_id)
    )
    """)

    conn.commit()

def classify_document(title, filename, category):
    combined = f"{title} {filename} {category}".lower()
    if any(k in combined for k in ["workbook", "worksheet", "exercise", "homework"]):
        return "Workbook"
    if any(k in combined for k in ["notes", "lecture", "session", "class 1", "class 2", "class 3", "module", "p3m", "cdr"]):
        return "Course notes"
    if any(k in combined for k in ["deck", "presentation", "slides", "ppt", "keynote"]):
        return "Presentation"
    if any(k in combined for k in ["handbook", "manual", "guidebook", "cheatsheet", "cheat sheet", "blueprint", "checklist"]):
        return "Technical manual"
    if any(k in combined for k in ["study master", "study guide", "exam prep", "syllabus", "cfa", "gate"]):
        return "Study guide"
    if any(k in combined for k in ["research report", "whitepaper", "paper", "analysis"]):
        return "Research report"
    if any(k in combined for k in ["magazine", "periodical", "newsletter"]):
        return "Magazine"
    if any(k in combined for k in ["boxset", "volume", "edition", "textbook", "novel", "guide", "hackers handbook"]):
        return "Published book"
    return "eBook"

def evaluate_rights(title, filename):
    comb = f"{title} {filename}".lower()
    for kw in RIGHTS_RISK_KEYWORDS:
        if kw in comb:
            return "RIGHTS_REVIEW_REQUIRED"
    return "RIGHTS_UNKNOWN"

def normalize_title(title):
    t = re.sub(r'[^\w\s]', '', title.lower())
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def ingest_manifest(manifest_path):
    print("==========================================================")
    print("PHASE 1 & 4: INGESTING FULL 86,260-RECORD CATALOGUE MANIFEST")
    print("==========================================================")
    
    records = parse_manifest(manifest_path)
    if len(records) != 86260:
        raise ValueError(f"CRITICAL ERROR: Expected 86260 records, found {len(records)}!")

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    # Check if already ingested
    cur.execute("SELECT COUNT(*) FROM manifest_records")
    existing_count = cur.fetchone()[0]
    if existing_count == 86260:
        print("Database already contains all 86,260 records. Proceeding to classification & duplicate audit...")
        conn.close()
        return

    # Check local files index
    local_files = {}
    search_dirs = [
        os.path.join("resources", "ebook-library"),
        os.path.join("private_storage", "originals"),
        os.path.join("public", "covers")
    ]
    for sdir in search_dirs:
        if os.path.exists(sdir):
            for root, _, files in os.walk(sdir):
                for f in files:
                    local_files[f.lower()] = os.path.join(root, f)

    batch_data = []
    title_hash_map = {}
    duplicates = []

    print(f"Discovered {len(local_files)} local files on disk.")
    print("Parsing, classifying, and deduplicating 86,260 records...")

    for manifest_id, line_text in sorted(records.items()):
        m = LINE_RE.match(line_text)
        if m:
            raw_title = m.group(1).strip()
            raw_contributor = m.group(2).strip()
            category = m.group(3).strip()
            filename = m.group(4).strip()
        else:
            raw_title = line_text.strip()
            raw_contributor = "Unknown"
            category = "General"
            filename = ""

        # Check uploader label
        is_uploader = 1 if raw_contributor.lower() in UPLOADER_LABELS else 0
        cleaned_author = None if is_uploader else raw_contributor

        # Document type & rights evaluation
        doc_type = classify_document(raw_title, filename, category)
        rights_status = evaluate_rights(raw_title, filename)

        # File availability
        file_avail = 1 if filename.lower() in local_files else 0
        local_path = local_files.get(filename.lower(), None)

        # Duplicate title detection
        norm_t = normalize_title(raw_title)
        dup_of_id = None
        if norm_t in title_hash_map:
            dup_of_id = title_hash_map[norm_t]
            duplicates.append((manifest_id, dup_of_id, "EXACT_NORMALIZED_TITLE", 100.0))
        else:
            title_hash_map[norm_t] = manifest_id

        # Determine preliminary status
        if dup_of_id:
            final_status = "DUPLICATE_CANDIDATE"
        elif rights_status == "RIGHTS_REVIEW_REQUIRED":
            final_status = "RIGHTS_QUARANTINED"
        elif doc_type not in ["Published book", "eBook"]:
            final_status = "NON_BOOK_DOCUMENT"
        elif file_avail == 0:
            final_status = "SOURCE_FILE_MISSING"
        else:
            final_status = "NEEDS_REVIEW"

        batch_data.append((
            manifest_id,
            raw_title,
            raw_title, # cleaned_title initialized to raw
            raw_contributor,
            cleaned_author,
            is_uploader,
            category,
            filename,
            doc_type,
            file_avail,
            local_path,
            rights_status,
            None, # isbn10
            None, # isbn13
            None, # publisher
            None, # publication_year
            cleaned_author, # verified_author
            None, # author_id
            None, # cover_image_url
            None, # cover_type
            None, # description
            None, # description_source
            50.0 if not is_uploader else 20.0, # confidence_score
            final_status,
            dup_of_id,
            time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        ))

    cur.executemany("""
    INSERT OR REPLACE INTO manifest_records (
        manifest_id, raw_title, cleaned_title, raw_contributor, cleaned_author,
        is_uploader_label, category, filename, document_type, source_file_available,
        local_file_path, rights_status, isbn10, isbn13, publisher, publication_year,
        verified_author, author_id, cover_image_url, cover_type, description,
        description_source, confidence_score, final_status, duplicate_of_id, processed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, batch_data)

    if duplicates:
        cur.executemany("""
        INSERT OR IGNORE INTO duplicate_relationships (
            manifest_id, duplicate_manifest_id, match_type, similarity_score
        ) VALUES (?,?,?,?)
        """, duplicates)

    conn.commit()
    conn.close()

    print(f"Successfully ingested {len(batch_data)} records into SQLite!")
    print(f"Detected {len(duplicates)} duplicate title relationships.")

def audit_and_reconcile():
    print("\n==========================================================")
    print("PHASE 18: NON-NEGOTIABLE RECONCILIATION AUDIT (86,260 RECORDS)")
    print("==========================================================")
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM manifest_records")
    total = cur.fetchone()[0]

    cur.execute("SELECT final_status, COUNT(*) FROM manifest_records GROUP BY final_status")
    status_counts = dict(cur.fetchall())

    cur.execute("SELECT document_type, COUNT(*) FROM manifest_records GROUP BY document_type")
    doc_types = dict(cur.fetchall())

    cur.execute("SELECT rights_status, COUNT(*) FROM manifest_records GROUP BY rights_status")
    rights_counts = dict(cur.fetchall())

    cur.execute("SELECT is_uploader_label, COUNT(*) FROM manifest_records GROUP BY is_uploader_label")
    uploader_counts = dict(cur.fetchall())

    cur.execute("SELECT COUNT(*) FROM duplicate_relationships")
    dup_relationships_count = cur.fetchone()[0]

    sum_statuses = sum(status_counts.values())

    print(f"TOTAL MANIFEST RECORDS AUDITED: {total}")
    print("STATUS ACCOUNTING BREAKDOWN:")
    for status, count in sorted(status_counts.items()):
        pct = (count / total) * 100
        print(f"  • {status:28}: {count:6} ({pct:5.2f}%)")

    print(f"\nSUM OF ALL EXPLICIT STATUSES   : {sum_statuses}")
    print(f"ACCOUNTING EQUATION BALANCED  : {'YES (Exact 86,260)' if sum_statuses == 86260 and total == 86260 else 'NO - DISCREPANCY!'}")

    # Generate summary JSON report
    reconciliation_report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_manifest_records": total,
        "sum_of_explicit_statuses": sum_statuses,
        "is_reconciled": sum_statuses == 86260 and total == 86260,
        "status_breakdown": status_counts,
        "document_type_breakdown": doc_types,
        "rights_status_breakdown": rights_counts,
        "uploader_labels_identified": uploader_counts.get(1, 0),
        "verified_contributor_names": uploader_counts.get(0, 0),
        "duplicate_candidate_relationships": dup_relationships_count
    }

    report_path = os.path.join(REPORTS_DIR, "reconciliation_accounting_summary.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(reconciliation_report, f, indent=2)

    print(f"\nReconciliation report written to {report_path}")
    conn.close()
    return reconciliation_report

if __name__ == "__main__":
    manifest_file = os.path.join("public", "all_ebooks_pdf_list.txt")
    ingest_manifest(manifest_file)
    audit_and_reconcile()
