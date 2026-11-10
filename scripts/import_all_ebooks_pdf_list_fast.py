#!/usr/bin/env python3
"""Fast import of all_ebooks_pdf_list.txt + existing cover maps/files."""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LIST_PATH = Path(r"C:\Users\tarik\Downloads\all_ebooks_pdf_list.txt")
COVERS = ROOT / "public" / "covers"
BOOK_COVERS = ROOT / "public" / "book-covers"
OUT_DIR = ROOT / "data" / "catalog"
PART1 = OUT_DIR / "master_86k_part1.json"
PART2 = OUT_DIR / "master_86k_part2.json"
EXISTING_MAP = OUT_DIR / "cover_map_from_book_covers.json"
UA = "AnonTroveListImporterFast/1.0"
MIN_BYTES = 4000

LINE_RE = re.compile(
    r"^\s*(\d+)\.\s+(.*?)\s+—\s+(.*?)\s+\[(.*?)\]\s+\((.*?)\)\s*$"
)

os.environ.setdefault("PYTHONUNBUFFERED", "1")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def log(msg: str) -> None:
    print(msg, flush=True)


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


def parse_list(path: Path) -> list[dict]:
    books: list[dict] = []
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            m = LINE_RE.match(line)
            if not m:
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


def index_existing_covers() -> set[str]:
    names: set[str] = set()
    for folder in (COVERS, BOOK_COVERS):
        if not folder.is_dir():
            continue
        for p in folder.iterdir():
            if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"} and p.stat().st_size >= MIN_BYTES:
                names.add(p.stem.lower())
    return names


def optimize_bytes(data: bytes, dest: Path, max_w: int = 480) -> bool:
    try:
        im = Image.open(BytesIO(data)).convert("RGB")
        w, h = im.size
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=78, optimize=True)
        return dest.exists() and dest.stat().st_size >= MIN_BYTES
    except Exception:
        return False


def fetch_ol(title: str, author: str) -> bytes | None:
    q = f"{clean_title(title)} {author}".strip()
    req = urllib.request.Request(
        "https://openlibrary.org/search.json?" + urllib.parse.urlencode({"q": q, "limit": 5}),
        headers={"User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=18) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None
    docs = data.get("docs") or []
    for d in docs:
        cover_id = d.get("cover_i")
        if not cover_id:
            continue
        try:
            req2 = urllib.request.Request(
                f"https://covers.openlibrary.org/b/id/{int(cover_id)}-L.jpg",
                headers={"User-Agent": UA},
            )
            with urllib.request.urlopen(req2, timeout=18) as resp2:
                img = resp2.read()
            if img and len(img) >= MIN_BYTES:
                return img
        except Exception:
            continue
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch-missing", type=int, default=400)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--skip-master-patch", action="store_true")
    args = ap.parse_args()

    t0 = time.time()
    log(f"Parsing {LIST_PATH} ...")
    books = parse_list(LIST_PATH)
    log(f"Parsed {len(books)} rows in {time.time()-t0:.1f}s")

    existing = index_existing_covers()
    log(f"Existing cover stems: {len(existing)}")

    preexisting_map = {}
    if EXISTING_MAP.exists():
        try:
            preexisting_map = (json.loads(EXISTING_MAP.read_text(encoding="utf-8")).get("map") or {})
        except Exception:
            preexisting_map = {}

    verified = 0
    missing: list[int] = []
    for i, b in enumerate(books):
        cid = str(b["catalogNum"])
        slug = b["slug"]
        # Prefer already synced map entry
        mapped = preexisting_map.get(cid) or preexisting_map.get(f"ref:{cid}") or preexisting_map.get(slug)
        if mapped and mapped.get("coverVerified") and mapped.get("coverImage"):
            b["coverImage"] = mapped["coverImage"]
            b["coverVerified"] = True
            b["coverSource"] = mapped.get("coverSource") or "book-covers+csv"
            b["coverType"] = "AUTHENTIC"
            verified += 1
            continue
        if cid in existing or slug in existing:
            if (COVERS / f"{slug}.jpg").exists():
                b["coverImage"] = f"/covers/{slug}.jpg"
            elif (COVERS / f"{cid}.jpg").exists():
                b["coverImage"] = f"/covers/{cid}.jpg"
            else:
                b["coverImage"] = f"/covers/{cid}.jpg"
            b["coverVerified"] = True
            b["coverSource"] = "local-covers"
            b["coverType"] = "AUTHENTIC"
            verified += 1
            continue
        b["coverImage"] = f"/api/covers/{slug}"
        b["coverVerified"] = False
        b["coverSource"] = "api-fallback"
        missing.append(i)

    log(f"Verified local/map covers: {verified} | missing: {len(missing)}")

    fetch_n = min(args.fetch_missing, len(missing))
    COVERS.mkdir(parents=True, exist_ok=True)

    def job(idx: int):
        b = books[idx]
        img = fetch_ol(b["title"], b.get("author") or "")
        if not img:
            return idx, False
        ok_slug = optimize_bytes(img, COVERS / f"{b['slug']}.jpg")
        ok_id = optimize_bytes(img, COVERS / f"{b['catalogNum']}.jpg")
        if ok_slug or ok_id:
            b["coverImage"] = f"/covers/{b['slug']}.jpg" if ok_slug else f"/covers/{b['catalogNum']}.jpg"
            b["coverVerified"] = True
            b["coverSource"] = "open-library"
            b["coverType"] = "AUTHENTIC"
            books[idx] = b
            return idx, True
        return idx, False

    fetched_ok = 0
    if fetch_n:
        log(f"Fetching Open Library for {fetch_n} missing titles...")
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            futs = [ex.submit(job, i) for i in missing[:fetch_n]]
            done = 0
            for fut in as_completed(futs):
                _, ok = fut.result()
                done += 1
                if ok:
                    fetched_ok += 1
                    verified += 1
                if done % 25 == 0:
                    log(f"  fetch progress {done}/{fetch_n} ok={fetched_ok}")

    cover_map = {}
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

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    directory_path = OUT_DIR / "directory_from_pdf_list.json"
    cover_map_path = OUT_DIR / "cover_map_from_pdf_list.json"
    summary_path = OUT_DIR / "pdf_list_import_summary.json"

    # Slim directory payload for runtime: keep essentials only
    slim = [
        {
            "catalogNum": b["catalogNum"],
            "slug": b["slug"],
            "title": b["title"],
            "author": b["author"],
            "category": b["category"],
            "fileName": b.get("fileName"),
            "coverImage": b.get("coverImage"),
            "coverVerified": b.get("coverVerified"),
        }
        for b in books
    ]
    log("Writing directory + cover map JSON...")
    directory_path.write_text(json.dumps({"books": slim, "count": len(slim)}, ensure_ascii=False), encoding="utf-8")
    cover_map_path.write_text(
        json.dumps({"map": cover_map, "count": len(books), "verified": verified}, ensure_ascii=False),
        encoding="utf-8",
    )

    master_stats = {"part1": 0, "part2": 0, "coverSet": 0}
    if not args.skip_master_patch and PART1.exists() and PART2.exists():
        by_num = {b["catalogNum"]: b for b in books}

        def patch_file(path: Path, key: str):
            items = json.loads(path.read_text(encoding="utf-8"))
            changed_rows = 0
            for item in items:
                ref = item.get("ref") or item.get("catalogNum")
                try:
                    ref_i = int(ref)
                except Exception:
                    m = re.search(r"(\d+)$", str(item.get("id") or item.get("slug") or ""))
                    ref_i = int(m.group(1)) if m else None
                if ref_i is None or ref_i not in by_num:
                    continue
                src = by_num[ref_i]
                touched = False
                if src.get("title"):
                    item["title"] = src["title"]
                    touched = True
                if src.get("author"):
                    item["author"] = src["author"]
                    touched = True
                if src.get("category"):
                    item["category"] = src["category"]
                    touched = True
                if src.get("fileName"):
                    item["fileName"] = src["fileName"]
                    touched = True
                if src.get("coverVerified") and src.get("coverImage"):
                    item["coverImage"] = src["coverImage"]
                    item["coverVerified"] = True
                    item["coverType"] = "AUTHENTIC"
                    master_stats["coverSet"] += 1
                    touched = True
                if touched:
                    changed_rows += 1
            path.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
            master_stats[key] = changed_rows
            log(f"Patched {path.name}: {changed_rows} rows")

        log("Patching master catalog parts...")
        patch_file(PART1, "part1")
        patch_file(PART2, "part2")

    summary = {
        "parsed": len(books),
        "verifiedCovers": verified,
        "fetchedOk": fetched_ok,
        "fetchAttempted": fetch_n,
        "masterPatch": master_stats,
        "seconds": round(time.time() - t0, 1),
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
