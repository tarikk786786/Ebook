#!/usr/bin/env python3
"""
Import ebook titles/authors/categories/filenames from:
  C:\\Users\\tarik\\Downloads\\all_ebooks_pdf_list.txt

Then:
  1) Attach local public/book-covers/{id}.jpg when present & good
  2) Copy optimized JPEGs into public/covers/{id}.jpg and public/covers/{slug}.jpg
  3) Write data/catalog/directory_from_pdf_list.json + cover_map_from_pdf_list.json
  4) Patch master_86k_part1/2 coverImage/title/author/category where improved
  5) Backfill missing covers via Open Library for the first N missing IDs
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
LIST_PATH = Path(r"C:\Users\tarik\Downloads\all_ebooks_pdf_list.txt")
BOOK_COVERS = ROOT / "public" / "book-covers"
COVERS = ROOT / "public" / "covers"
OUT_DIR = ROOT / "data" / "catalog"
PART1 = OUT_DIR / "master_86k_part1.json"
PART2 = OUT_DIR / "master_86k_part2.json"
UA = "AnonTroveListImporter/1.0 (mailto:apnix7@gmail.com)"
MIN_BYTES = 4000

LINE_RE = re.compile(
    r"^\s*(\d+)\.\s+(.*?)\s+—\s+(.*?)\s+\[(.*?)\]\s+\((.*?)\)\s*$"
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def clean_title(title: str) -> str:
    title = title or ""
    title = re.sub(r"^\s*Microsoft Word\s*-\s*", "", title, flags=re.I)
    title = re.sub(r"\s*[—–-]\s*Volume\s+\d+.*$", "", title, flags=re.I)
    title = re.sub(r"\s+Volume\s+\d+.*$", "", title, flags=re.I)
    return re.sub(r"\s{2,}", " ", title).strip()


def cover_quality(path: Path) -> str:
    try:
        if not path.exists() or path.stat().st_size < MIN_BYTES:
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


def optimize_jpeg(src: Path | bytes, dest: Path, max_w: int = 480) -> bool:
    try:
        if isinstance(src, (bytes, bytearray)):
            im = Image.open(BytesIO(src)).convert("RGB")
        else:
            im = Image.open(src).convert("RGB")
        w, h = im.size
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=78, optimize=True)
        return dest.exists() and dest.stat().st_size >= MIN_BYTES
    except Exception:
        return False


def parse_list(path: Path) -> list[dict]:
    books: list[dict] = []
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            m = LINE_RE.match(line)
            if not m:
                # Fallback: "N. title"
                m2 = re.match(r"^\s*(\d+)\.\s+(.+)$", line)
                if not m2:
                    continue
                catalog_num = int(m2.group(1))
                title = clean_title(m2.group(2))
                books.append(
                    {
                        "catalogNum": catalog_num,
                        "title": title,
                        "author": "Editorial Board",
                        "category": "General & Technical Reference",
                        "fileName": "",
                        "slug": slugify(title),
                        "id": f"book-{catalog_num}",
                    }
                )
                continue
            catalog_num = int(m.group(1))
            title = clean_title(m.group(2))
            author = (m.group(3) or "").strip() or "Editorial Board"
            category = (m.group(4) or "").strip() or "General & Technical Reference"
            file_name = (m.group(5) or "").strip()
            books.append(
                {
                    "catalogNum": catalog_num,
                    "title": title,
                    "author": author,
                    "category": category,
                    "fileName": file_name,
                    "slug": slugify(title),
                    "id": f"book-{catalog_num}",
                }
            )
    return books


def http_get(url: str, timeout: float = 18) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception:
        return None


def open_library_cover(title: str, author: str) -> bytes | None:
    q = f"{clean_title(title)} {author}".strip()
    raw = http_get(
        "https://openlibrary.org/search.json?"
        + urllib.parse.urlencode({"q": q, "limit": 5})
    )
    if not raw:
        return None
    try:
        data = json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        return None
    docs = data.get("docs") or []
    author_parts = [p for p in re.split(r"\s+", (author or "").lower()) if len(p) > 2]
    ranked = []
    for d in docs:
        cover_id = d.get("cover_i")
        if not cover_id:
            continue
        names = " ".join(d.get("author_name") or []).lower()
        score = 2 if author_parts and all(p in names for p in author_parts[:2]) else 1
        ranked.append((score, int(cover_id)))
    ranked.sort(reverse=True)
    for _, cover_id in ranked[:2]:
        img = http_get(f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg")
        if img and len(img) >= MIN_BYTES:
            return img
    return None


def attach_local_or_download(book: dict, fetch_missing: bool) -> dict:
    catalog_num = book["catalogNum"]
    slug = book["slug"]
    src_candidates = [
        BOOK_COVERS / f"{catalog_num}.jpg",
        BOOK_COVERS / f"{catalog_num}.png",
        COVERS / f"{catalog_num}.jpg",
        COVERS / f"{slug}.jpg",
    ]
    local = next((p for p in src_candidates if cover_quality(p) == "good"), None)
    source = "local"
    img_bytes = None
    if local:
        try:
            img_bytes = local.read_bytes()
        except Exception:
            img_bytes = None
    elif fetch_missing:
        img_bytes = open_library_cover(book["title"], book.get("author") or "")
        source = "open-library" if img_bytes else ""

    if not img_bytes:
        book["coverImage"] = f"/api/covers/{slug}"
        book["coverVerified"] = False
        book["coverSource"] = "api-fallback"
        return book

    id_dest = COVERS / f"{catalog_num}.jpg"
    slug_dest = COVERS / f"{slug}.jpg"
    ok_id = optimize_jpeg(img_bytes, id_dest)
    ok_slug = optimize_jpeg(img_bytes, slug_dest)
    if ok_slug:
        book["coverImage"] = f"/covers/{slug}.jpg"
        book["coverVerified"] = True
        book["coverSource"] = source
        book["coverType"] = "AUTHENTIC"
    elif ok_id:
        book["coverImage"] = f"/covers/{catalog_num}.jpg"
        book["coverVerified"] = True
        book["coverSource"] = source
        book["coverType"] = "AUTHENTIC"
    else:
        book["coverImage"] = f"/api/covers/{slug}"
        book["coverVerified"] = False
        book["coverSource"] = "api-fallback"
    return book


def patch_master(books_by_num: dict[int, dict]) -> dict:
    stats = {"part1": 0, "part2": 0, "coverSet": 0, "metaSet": 0}

    def patch_list(items: list, key: str):
        for item in items:
            ref = item.get("ref") or item.get("catalogNum")
            try:
                ref_i = int(ref)
            except Exception:
                # try trailing digits from id/slug
                m = re.search(r"(\d+)$", str(item.get("id") or item.get("slug") or ""))
                ref_i = int(m.group(1)) if m else None
            if ref_i is None or ref_i not in books_by_num:
                continue
            src = books_by_num[ref_i]
            changed = False
            if src.get("title") and (
                not item.get("title")
                or item.get("title") == "Untitled"
                or len(str(item.get("title") or "")) < 4
            ):
                item["title"] = src["title"]
                changed = True
            if src.get("author") and (
                not item.get("author")
                or item.get("author") in {"Editorial Board", "AnonTrove Guild"}
            ):
                item["author"] = src["author"]
                changed = True
            if src.get("category") and (
                not item.get("category")
                or item.get("category") in {"General", "General & Technical Reference"}
            ):
                item["category"] = src["category"]
                changed = True
            if src.get("fileName") and not item.get("fileName"):
                item["fileName"] = src["fileName"]
                changed = True
            if src.get("coverVerified") and src.get("coverImage"):
                weak = (
                    not item.get("coverImage")
                    or "standard-shelf" in str(item.get("coverImage"))
                    or str(item.get("coverImage")).startswith("/book-covers/")
                    or str(item.get("coverImage")).startswith("/api/covers/")
                )
                if weak:
                    item["coverImage"] = src["coverImage"]
                    item["coverVerified"] = True
                    item["coverType"] = "AUTHENTIC"
                    stats["coverSet"] += 1
                    changed = True
            if changed:
                stats[key] += 1
                stats["metaSet"] += 1

    for part_path, key in ((PART1, "part1"), (PART2, "part2")):
        if not part_path.exists():
            continue
        print(f"Patching {part_path.name}...")
        items = json.loads(part_path.read_text(encoding="utf-8"))
        patch_list(items, key)
        part_path.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="0 = all rows")
    ap.add_argument("--fetch-missing", type=int, default=300, help="OL fetch for first N missing")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--skip-master-patch", action="store_true")
    args = ap.parse_args()

    if not LIST_PATH.exists():
        raise SystemExit(f"Missing list file: {LIST_PATH}")

    print(f"Parsing {LIST_PATH}...")
    books = parse_list(LIST_PATH)
    if args.limit and args.limit > 0:
        books = books[: args.limit]
    print(f"Parsed {len(books)} ebook rows")

    COVERS.mkdir(parents=True, exist_ok=True)
    missing_idxs = []
    for i, b in enumerate(books):
        local_hit = any(
            cover_quality(p) == "good"
            for p in (
                BOOK_COVERS / f"{b['catalogNum']}.jpg",
                COVERS / f"{b['catalogNum']}.jpg",
                COVERS / f"{b['slug']}.jpg",
            )
        )
        if local_hit:
            attach_local_or_download(b, fetch_missing=False)
        else:
            missing_idxs.append(i)

    print(f"Local covers attached where available. Missing: {len(missing_idxs)}")

    fetch_n = min(args.fetch_missing, len(missing_idxs))
    to_fetch = missing_idxs[:fetch_n]
    print(f"Fetching Open Library covers for {fetch_n} missing titles...")

    def _job(idx: int):
        return idx, attach_local_or_download(books[idx], fetch_missing=True)

    done = 0
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = [ex.submit(_job, i) for i in to_fetch]
        for fut in as_completed(futs):
            idx, book = fut.result()
            books[idx] = book
            done += 1
            if done % 25 == 0 or book.get("coverVerified"):
                print(
                    f"[{done}/{fetch_n}] "
                    f"{'OK' if book.get('coverVerified') else 'MISS'} "
                    f"#{book['catalogNum']} {book['title'][:50]}"
                )

    # Ensure remaining missing still have API fallback path
    for i in missing_idxs[fetch_n:]:
        if not books[i].get("coverImage"):
            books[i]["coverImage"] = f"/api/covers/{books[i]['slug']}"
            books[i]["coverVerified"] = False
            books[i]["coverSource"] = "api-fallback"

    cover_map = {}
    verified = 0
    for b in books:
        entry = {
            "coverImage": b.get("coverImage"),
            "coverVerified": bool(b.get("coverVerified")),
            "coverSource": b.get("coverSource"),
            "title": b.get("title"),
            "author": b.get("author"),
            "category": b.get("category"),
            "fileName": b.get("fileName"),
            "catalogNum": b.get("catalogNum"),
        }
        cover_map[b["slug"]] = entry
        cover_map[str(b["catalogNum"])] = entry
        cover_map[f"ref:{b['catalogNum']}"] = entry
        if b.get("coverVerified"):
            verified += 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    directory_path = OUT_DIR / "directory_from_pdf_list.json"
    cover_map_path = OUT_DIR / "cover_map_from_pdf_list.json"
    summary_path = OUT_DIR / "pdf_list_import_summary.json"

    directory_path.write_text(
        json.dumps({"books": books, "count": len(books)}, ensure_ascii=False),
        encoding="utf-8",
    )
    cover_map_path.write_text(
        json.dumps({"map": cover_map, "count": len(books), "verified": verified}, ensure_ascii=False),
        encoding="utf-8",
    )

    master_stats = {}
    if not args.skip_master_patch:
        by_num = {b["catalogNum"]: b for b in books}
        master_stats = patch_master(by_num)

    summary = {
        "parsed": len(books),
        "verifiedCovers": verified,
        "fetchAttempted": fetch_n,
        "masterPatch": master_stats,
        "outputs": {
            "directory": str(directory_path),
            "coverMap": str(cover_map_path),
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
