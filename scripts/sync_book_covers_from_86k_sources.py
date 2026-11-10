#!/usr/bin/env python3
"""
Sync numbered covers from public/book-covers (catalog/manifest IDs) into
public/covers using titles/authors from:
  - data/ebook_all_86260_link_directory.csv  (from ebook_all_86260_link_directory zip)
  - data/catalog/directory_86k_from_pdf.json / curated maps (from 86k Directory PDF)

Also writes data/catalog/cover_map_from_book_covers.json for the storefront overlay.
"""
from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
BOOK_COVERS = ROOT / "public" / "book-covers"
COVERS = ROOT / "public" / "covers"
CSV_PATH = ROOT / "data" / "ebook_all_86260_link_directory.csv"
OUT_MAP = ROOT / "data" / "catalog" / "cover_map_from_book_covers.json"
SUMMARY = ROOT / "data" / "catalog" / "book_cover_sync_summary.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def clean_title(title: str) -> str:
    title = title or ""
    title = re.sub(r"\s*[—–-]\s*Volume\s+\d+.*$", "", title, flags=re.I)
    title = re.sub(r"\s+Volume\s+\d+.*$", "", title, flags=re.I)
    return re.sub(r"\s{2,}", " ", title).strip()


def cover_quality(path: Path) -> str:
    try:
        if path.stat().st_size < 5000:
            return "tiny"
        im = Image.open(path).convert("RGB").resize((48, 64))
        st = ImageStat.Stat(im)
        mean = sum(st.mean) / 3.0
        var = sum(st.var) / 3.0
        if mean > 245 and var < 80:
            return "blank"
        if mean < 38 and var < 900:
            return "dark_synthetic"
        return "good"
    except Exception:
        return "bad"


def optimize_jpeg(src: Path, dest: Path, max_w: int = 480) -> bool:
    try:
        im = Image.open(src).convert("RGB")
        w, h = im.size
        if w > max_w:
            nh = int(h * (max_w / float(w)))
            im = im.resize((max_w, max(nh, 1)), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=78, optimize=True)
        return dest.exists() and dest.stat().st_size >= 4000
    except Exception:
        return False


def load_csv_rows() -> dict[int, dict]:
    rows: dict[int, dict] = {}
    if not CSV_PATH.exists():
        print(f"CSV missing: {CSV_PATH}")
        return rows
    with CSV_PATH.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                mid = int((row.get("Manifest ID") or row.get("\ufeffManifest ID") or "").strip())
            except Exception:
                continue
            title = (row.get("Listed title") or "").strip()
            author = (row.get("Listed author / contributor (unverified)") or "").strip()
            category = (row.get("Listed category") or "").strip()
            filename = (row.get("Source filename") or "").strip()
            if not title:
                continue
            rows[mid] = {
                "catalogNum": mid,
                "title": title,
                "author": author,
                "category": category,
                "fileName": filename,
                "slug": slugify(clean_title(title)),
            }
    return rows


def main():
    COVERS.mkdir(parents=True, exist_ok=True)
    csv_rows = load_csv_rows()
    print(f"CSV titles loaded: {len(csv_rows)}")

    cover_files = sorted(BOOK_COVERS.glob("*.jpg")) + sorted(BOOK_COVERS.glob("*.png"))
    print(f"book-covers files: {len(cover_files)}")

    cover_map: dict[str, dict] = {}
    counts = {
        "scanned": 0,
        "good": 0,
        "skipped_quality": 0,
        "copied_id": 0,
        "copied_slug": 0,
        "csv_matched": 0,
        "no_csv": 0,
    }

    for src in cover_files:
        counts["scanned"] += 1
        stem = src.stem
        if not stem.isdigit():
            continue
        catalog_num = int(stem)
        q = cover_quality(src)
        if q != "good":
            counts["skipped_quality"] += 1
            continue
        counts["good"] += 1

        meta = csv_rows.get(catalog_num)
        if meta:
            counts["csv_matched"] += 1
        else:
            counts["no_csv"] += 1
            meta = {
                "catalogNum": catalog_num,
                "title": f"Catalog #{catalog_num}",
                "author": "",
                "category": "",
                "slug": f"catalog-{catalog_num}",
            }

        # Always write numeric id cover for API fuzzy match
        id_dest = COVERS / f"{catalog_num}.jpg"
        if optimize_jpeg(src, id_dest):
            counts["copied_id"] += 1

        slug = meta["slug"]
        slug_dest = COVERS / f"{slug}.jpg"
        # Don't overwrite a larger/newer real cover with a worse one
        should_write_slug = True
        if slug_dest.exists() and cover_quality(slug_dest) == "good":
            if slug_dest.stat().st_size >= id_dest.stat().st_size * 0.85:
                should_write_slug = False
        if should_write_slug and optimize_jpeg(src, slug_dest):
            counts["copied_slug"] += 1

        entry = {
            "coverImage": f"/covers/{slug}.jpg" if slug_dest.exists() else f"/covers/{catalog_num}.jpg",
            "coverVerified": True,
            "coverSource": "book-covers+csv",
            "title": meta.get("title"),
            "author": meta.get("author"),
            "category": meta.get("category"),
            "catalogNum": catalog_num,
        }
        cover_map[slug] = entry
        cover_map[str(catalog_num)] = entry
        cover_map[f"ref:{catalog_num}"] = entry

        if counts["good"] % 200 == 0:
            print(f"  synced {counts['good']} good covers...")

    OUT_MAP.parent.mkdir(parents=True, exist_ok=True)
    OUT_MAP.write_text(json.dumps({"map": cover_map, "counts": counts}, ensure_ascii=False), encoding="utf-8")
    SUMMARY.write_text(json.dumps(counts, indent=2), encoding="utf-8")
    print(json.dumps(counts, indent=2))
    print(f"Wrote {OUT_MAP}")


if __name__ == "__main__":
    main()
