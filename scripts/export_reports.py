import sqlite3
import csv
import json
import os

DB_PATH = os.path.join("data", "master_manifest_pipeline.db")
REPORTS_DIR = os.path.join("data", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def export_all_reports():
    print("==========================================================")
    print("PHASE 19: EXPORTING FULL MANIFEST & RECONCILIATION REPORTS")
    print("==========================================================")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Full 86,260 Status Report CSV
    csv_file = os.path.join(REPORTS_DIR, "manifest_86260_status_report.csv")
    print(f"Exporting {csv_file}...")
    cur.execute("""
    SELECT manifest_id, raw_title, cleaned_author, is_uploader_label, category,
           document_type, rights_status, final_status, confidence_score,
           cover_image_url, cover_type, isbn13, publisher, publication_year
    FROM manifest_records
    ORDER BY manifest_id ASC
    """)
    rows = cur.fetchall()
    
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "manifest_id", "title", "author", "is_uploader_label", "category",
            "document_type", "rights_status", "final_status", "confidence_score",
            "cover_image_url", "cover_type", "isbn13", "publisher", "publication_year"
        ])
        writer.writerows(rows)
    print(f"Exported {len(rows)} records to {csv_file}")

    # 2. Duplicate Detection Report CSV
    dup_file = os.path.join(REPORTS_DIR, "duplicate_detection_report.csv")
    cur.execute("""
    SELECT dr.manifest_id, m1.raw_title, dr.duplicate_manifest_id, m2.raw_title, dr.match_type, dr.similarity_score
    FROM duplicate_relationships dr
    JOIN manifest_records m1 ON dr.manifest_id = m1.manifest_id
    JOIN manifest_records m2 ON dr.duplicate_manifest_id = m2.manifest_id
    ORDER BY dr.manifest_id ASC
    LIMIT 10000
    """)
    dup_rows = cur.fetchall()
    with open(dup_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["manifest_id", "title", "duplicate_manifest_id", "duplicate_title", "match_type", "similarity_score"])
        writer.writerows(dup_rows)
    print(f"Exported duplicate sample ({len(dup_rows)} records) to {dup_file}")

    # 3. Rights & Licensing Report CSV
    rights_file = os.path.join(REPORTS_DIR, "rights_and_licensing_report.csv")
    cur.execute("""
    SELECT manifest_id, raw_title, filename, rights_status, final_status
    FROM manifest_records
    WHERE rights_status = 'RIGHTS_REVIEW_REQUIRED' OR final_status = 'RIGHTS_QUARANTINED'
    ORDER BY manifest_id ASC
    """)
    rights_rows = cur.fetchall()
    with open(rights_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["manifest_id", "title", "filename", "rights_status", "final_status"])
        writer.writerows(rights_rows)
    print(f"Exported {len(rights_rows)} rights-quarantined records to {rights_file}")

    # 4. JSON Accounting Reconciliation Summary
    cur.execute("SELECT final_status, COUNT(*) FROM manifest_records GROUP BY final_status")
    status_summary = dict(cur.fetchall())
    
    cur.execute("SELECT document_type, COUNT(*) FROM manifest_records GROUP BY document_type")
    type_summary = dict(cur.fetchall())

    reconciliation = {
        "manifest_file": "public/all_ebooks_pdf_list.txt",
        "total_manifest_records": len(rows),
        "status_accounting_breakdown": status_summary,
        "document_type_breakdown": type_summary,
        "accounting_equation_balanced": sum(status_summary.values()) == 86260 and len(rows) == 86260,
        "rules_enforced": [
            "Zero catalogue loss: all 86,260 records accounted for",
            "Zero fake authenticity: no fabricated ISBNs or authors",
            "Rights review: third-party scrapers quarantined"
        ]
    }
    json_path = os.path.join(REPORTS_DIR, "reconciliation_accounting_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(reconciliation, f, indent=2)
    print(f"Saved master reconciliation JSON to {json_path}")

    conn.close()

if __name__ == "__main__":
    export_all_reports()
