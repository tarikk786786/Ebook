#!/usr/bin/env python3
"""
Generate final cover recovery CSV reports from covers_86k.sqlite + catalog map.

Writes into data/reports/:
  ebook_cover_results.csv
  missing_covers.csv
  failed_image_downloads.csv
  manual_review.csv
  duplicate_cover_images.csv
  cover_source_statistics.csv
"""
from __future__ import annotations

import csv
import hashlib
import json
import sqlite3
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "data" / "covers_86k.sqlite"
MAP_PATH = ROOT / "data" / "catalog" / "catalog_file_map.json"
COVERS = ROOT / "public" / "covers"
OUT = ROOT / "data" / "reports"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def file_sha256(path: Path, limit: int = 2_000_000) -> str | None:
    try:
        h = hashlib.sha256()
        with path.open("rb") as f:
            remaining = limit
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                h.update(chunk)
                remaining -= len(chunk)
        return h.hexdigest()
    except Exception:
        return None


def main() -> None:
    if not DB.exists():
        print("covers_86k.sqlite missing", flush=True)
        sys.exit(1)

    mapping = {}
    if MAP_PATH.exists():
        mapping = (json.loads(MAP_PATH.read_text(encoding="utf-8")).get("map")) or {}

    conn = sqlite3.connect(str(DB))
    cols = {r[1] for r in conn.execute("pragma table_info(covers)")}
    conf_expr = "confidence" if "confidence" in cols else "NULL"
    file_expr = "file_name" if "file_name" in cols else "NULL"
    err_expr = "error" if "error" in cols else "NULL"

    rows = conn.execute(
        f"""
        SELECT catalog_num, slug, title, author, category, status, source,
               cover_url, ol_cover_id, local_path, {conf_expr}, {file_expr}, {err_expr}
        FROM covers
        ORDER BY catalog_num
        """
    ).fetchall()

    OUT.mkdir(parents=True, exist_ok=True)
    results_path = OUT / "ebook_cover_results.csv"
    missing_path = OUT / "missing_covers.csv"
    failed_path = OUT / "failed_image_downloads.csv"
    review_path = OUT / "manual_review.csv"
    dup_path = OUT / "duplicate_cover_images.csv"
    stats_path = OUT / "cover_source_statistics.csv"

    fieldnames = [
        "ebook_id",
        "title",
        "author",
        "original_filename",
        "cover_source",
        "cover_source_url",
        "image_storage_path",
        "cover_status",
        "confidence",
        "rights_status",
        "error",
    ]

    source_counter: Counter = Counter()
    status_counter: Counter = Counter()
    installed = 0
    missing_rows = []
    failed_rows = []
    review_rows = []
    all_rows = []

    hash_to_ids: dict[str, list[int]] = defaultdict(list)

    for (
        catalog_num,
        slug,
        title,
        author,
        category,
        status,
        source,
        cover_url,
        ol_cover_id,
        local_path,
        confidence,
        file_name,
        error,
    ) in rows:
        base = mapping.get(str(catalog_num)) or {}
        original_filename = file_name or base.get("fileName") or ""
        storage = local_path
        disk_ok = False
        if local_path:
            p = ROOT / local_path
            if p.exists() and p.stat().st_size >= 2000:
                disk_ok = True
                digest = file_sha256(p)
                if digest:
                    hash_to_ids[digest].append(int(catalog_num))
        elif (COVERS / f"{catalog_num}.jpg").exists():
            storage = f"public/covers/{catalog_num}.jpg"
            disk_ok = True
            digest = file_sha256(COVERS / f"{catalog_num}.jpg")
            if digest:
                hash_to_ids[digest].append(int(catalog_num))

        # Installed = found + (local file OR remote URL usable by site)
        effective_status = status
        if status == "found":
            if disk_ok or (cover_url and str(cover_url).startswith(("http://", "https://", "/"))):
                installed += 1
            else:
                effective_status = "failed_install"
        rights = "unknown"
        if source in {"local-disk", "local-pdf-render", "pymupdf-pdf", "epub-opf-zipfile", "calibre-ebook-meta"}:
            rights = "embedded_original"
        elif source in {"open-library", "internet-archive"}:
            rights = "remote_display_permitted_source"
        elif source == "google-books":
            rights = "google_books_image_links"
        elif source == "manual":
            rights = "admin_approved"

        conf = confidence or ("HIGH" if source and source.startswith(("local", "calibre", "epub", "pymupdf")) else "")
        if not conf and status == "found":
            conf = "MEDIUM" if source in {"internet-archive", "open-library", "google-books"} else "LOW"
        if not conf and status != "found":
            conf = "LOW"

        row = {
            "ebook_id": catalog_num,
            "title": title or "",
            "author": author or "",
            "original_filename": original_filename,
            "cover_source": source or "",
            "cover_source_url": cover_url or "",
            "image_storage_path": storage or "",
            "cover_status": effective_status or "",
            "confidence": conf,
            "rights_status": rights,
            "error": error or "",
        }
        all_rows.append(row)
        status_counter[effective_status or ""] += 1
        if status == "found" and source:
            source_counter[source] += 1

        if status in {"pending", "not_found"} or effective_status == "failed_install":
            missing_rows.append(row)
        if effective_status == "failed_install" or (error and "download" in str(error).lower()):
            failed_rows.append(row)
        if status == "review" or conf == "MEDIUM":
            review_rows.append(row)

    with results_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(all_rows)

    with missing_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(missing_rows)

    with failed_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(failed_rows)

    with review_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(review_rows)

    dup_rows = []
    for digest, ids in sorted(hash_to_ids.items(), key=lambda x: -len(x[1])):
        if len(ids) < 2:
            continue
        dup_rows.append(
            {
                "sha256_prefix": digest[:16],
                "count": len(ids),
                "ebook_ids": ",".join(str(i) for i in ids[:50]),
            }
        )
    with dup_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["sha256_prefix", "count", "ebook_ids"])
        w.writeheader()
        w.writerows(dup_rows)

    with stats_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["metric", "value"])
        w.writeheader()
        w.writerow({"metric": "generated_at", "value": time.strftime("%Y-%m-%dT%H:%M:%S")})
        w.writerow({"metric": "total_records", "value": len(all_rows)})
        w.writerow({"metric": "installed_or_linked", "value": installed})
        for k, v in sorted(status_counter.items()):
            w.writerow({"metric": f"status:{k}", "value": v})
        for k, v in source_counter.most_common():
            w.writerow({"metric": f"source:{k}", "value": v})
        w.writerow({"metric": "missing_rows", "value": len(missing_rows)})
        w.writerow({"metric": "manual_review_rows", "value": len(review_rows)})
        w.writerow({"metric": "duplicate_hash_groups", "value": len(dup_rows)})

    summary = {
        "total": len(all_rows),
        "installed_or_linked": installed,
        "missing": len(missing_rows),
        "review": len(review_rows),
        "failed": len(failed_rows),
        "duplicate_groups": len(dup_rows),
        "by_status": dict(status_counter),
        "by_source": dict(source_counter),
        "files": {
            "ebook_cover_results.csv": str(results_path),
            "missing_covers.csv": str(missing_path),
            "failed_image_downloads.csv": str(failed_path),
            "manual_review.csv": str(review_path),
            "duplicate_cover_images.csv": str(dup_path),
            "cover_source_statistics.csv": str(stats_path),
        },
    }
    (OUT / "cover_reports_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)
    conn.close()


if __name__ == "__main__":
    main()
