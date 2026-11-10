#!/usr/bin/env python3
"""
Phase 1: Map all_ebooks_catalog.csv → local files + covers_86k.sqlite.

Identity keys (never title alone):
  - CSV Index (catalog_num)
  - File Name (normalized)
  - slug(title)+author fingerprint for cross-checks only

Writes:
  data/catalog/catalog_file_map.json
  data/reports/catalog_file_map_audit.json
"""
from __future__ import annotations

import csv
import json
import re
import sqlite3
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "public" / "all_ebooks_catalog.csv"
DB = ROOT / "data" / "covers_86k.sqlite"
OUT_MAP = ROOT / "data" / "catalog" / "catalog_file_map.json"
OUT_AUDIT = ROOT / "data" / "reports" / "catalog_file_map_audit.json"

STORAGE_ROOTS = [
    ROOT / "private_storage",
    Path(r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\telegram-ebook-store-bot\storage"),
    Path(r"C:\Users\tarik\Downloads\TG\TelegramPdfExtractor\Telegram_All_Books"),
]

EXTS = {".pdf", ".epub", ".mobi", ".azw", ".azw3"}

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def norm_filename(name: str) -> str:
    name = unicodedata.normalize("NFKD", name or "").casefold()
    name = Path(name).name
    name = re.sub(r"\.(pdf|epub|mobi|azw3?)$", "", name)
    return re.sub(r"[^a-z0-9]+", "", name)


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def index_storage() -> dict[str, list[str]]:
    """Map normalized stem → list of absolute paths (duplicates preserved)."""
    idx: dict[str, list[str]] = {}
    scanned = 0
    for root in STORAGE_ROOTS:
        if not root.exists():
            print(f"skip missing {root}", flush=True)
            continue
        print(f"indexing {root} ...", flush=True)
        t0 = time.time()
        root_count = 0
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in EXTS:
                continue
            # skip incomplete downloads
            if p.suffix.lower() in {".part", ".temp"}:
                continue
            key = norm_filename(p.name)
            if not key:
                continue
            idx.setdefault(key, []).append(str(p))
            scanned += 1
            root_count += 1
            if root_count % 2000 == 0:
                print(f"  {root.name}: {root_count} files...", flush=True)
        print(f"  done {root.name}: {root_count} in {time.time()-t0:.1f}s", flush=True)
    print(f"total indexed files={scanned} unique_keys={len(idx)}", flush=True)
    return idx


def main() -> None:
    file_index = index_storage()

    mapping = {}
    stats = {
        "csv_rows": 0,
        "matched_file": 0,
        "unmatched_file": 0,
        "duplicate_filenames": 0,
        "db_rows": 0,
        "db_aligned": 0,
    }

    db_slugs = {}
    if DB.exists():
        con = sqlite3.connect(str(DB))
        for catalog_num, slug, title, author, status, source, cover_url in con.execute(
            "SELECT catalog_num, slug, title, author, status, source, cover_url FROM covers"
        ):
            db_slugs[int(catalog_num)] = {
                "slug": slug,
                "title": title,
                "author": author,
                "status": status,
                "source": source,
                "cover_url": cover_url,
            }
        stats["db_rows"] = len(db_slugs)
        con.close()

    with CSV_PATH.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stats["csv_rows"] += 1
            try:
                catalog_num = int(str(row.get("Index") or "").strip())
            except ValueError:
                continue
            title = (row.get("Title") or "").strip()
            author = (row.get("Author") or "").strip()
            category = (row.get("Category") or "").strip()
            fmt = (row.get("Format") or "").strip()
            pages = row.get("Pages")
            filename = (row.get("File Name") or "").strip()
            key = norm_filename(filename)
            paths = file_index.get(key) or []
            if len(paths) > 1:
                stats["duplicate_filenames"] += 1
            if paths:
                stats["matched_file"] += 1
            else:
                stats["unmatched_file"] += 1

            db = db_slugs.get(catalog_num)
            if db:
                stats["db_aligned"] += 1

            slug = (db or {}).get("slug") or slugify(title)
            entry = {
                "catalogNum": catalog_num,
                "title": title,
                "author": author,
                "category": category,
                "format": fmt,
                "pages": pages,
                "fileName": filename,
                "fileKey": key,
                "localPaths": paths[:5],
                "localPath": paths[0] if paths else None,
                "slug": slug,
                "dbStatus": (db or {}).get("status"),
                "dbSource": (db or {}).get("source"),
                "dbCoverUrl": (db or {}).get("cover_url"),
                "identity": f"catalog:{catalog_num}|file:{key}|slug:{slug}",
            }
            mapping[str(catalog_num)] = entry
            if stats["csv_rows"] % 10000 == 0:
                print(f"csv processed {stats['csv_rows']}", flush=True)

    OUT_MAP.parent.mkdir(parents=True, exist_ok=True)
    OUT_MAP.write_text(
        json.dumps({"map": mapping, "count": len(mapping), "generatedAt": time.time()}, ensure_ascii=False),
        encoding="utf-8",
    )
    OUT_AUDIT.parent.mkdir(parents=True, exist_ok=True)
    OUT_AUDIT.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print(json.dumps(stats, indent=2))
    print(f"Wrote {OUT_MAP} ({OUT_MAP.stat().st_size/1e6:.1f} MB)")
    print(f"Wrote {OUT_AUDIT}")


if __name__ == "__main__":
    main()
