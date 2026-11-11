#!/usr/bin/env python3
"""
Backfill ebook cover JPEGs using free public APIs:
  1) Open Library
  2) Google Books (no key; soft-fail on 429)
  3) Internet Archive item images

Writes to public/covers/{slug}.jpg and updates catalog cover maps.
Skips/replaces dark branded synthetic local placeholders.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
COVERS_DIR = ROOT / "public" / "covers"
CURSOR_PATH = ROOT / "data" / "catalog" / "cover_backfill_cursor.json"
UA = "AnonTroveCoverBackfill/1.0 (mailto:apnix7@gmail.com)"
MIN_BYTES = 3500

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def slugify(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80]


def clean_title(title: str) -> str:
    title = title or ""
    title = re.sub(r"\s*[—–-]\s*Volume\s+\d+.*$", "", title, flags=re.I)
    title = re.sub(r"\s+Volume\s+\d+.*$", "", title, flags=re.I)
    title = re.sub(r"\s*\(Vol\.?\s*\d+.*?\)\s*$", "", title, flags=re.I)
    return re.sub(r"\s{2,}", " ", title).strip()


def http_get(url: str, timeout: float = 18) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception:
        return None


def http_json(url: str, timeout: float = 18) -> Any | None:
    raw = http_get(url, timeout=timeout)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8", errors="replace"))
    except Exception:
        return None


def is_synthetic_cover(path: Path) -> bool:
    """Dark navy branded placeholders are nearly solid dark with low variance."""
    try:
        if not path.exists() or path.stat().st_size < MIN_BYTES:
            return True
        img = Image.open(path).convert("RGB")
        img = img.resize((64, 96))
        stat = ImageStat.Stat(img)
        mean = sum(stat.mean) / 3.0
        var = sum(stat.var) / 3.0
        # Real publisher covers usually have higher brightness or variance
        if mean < 38 and var < 900:
            return True
        # Extremely uniform dark frames
        if mean < 55 and var < 350:
            return True
        return False
    except Exception:
        return True


def save_jpeg(data: bytes, dest: Path) -> bool:
    if not data or len(data) < MIN_BYTES:
        return False
    try:
        img = Image.open(BytesIO(data))
        img.verify()
        img = Image.open(BytesIO(data)).convert("RGB")
        # Reject tiny / blank-ish images
        w, h = img.size
        if w < 80 or h < 100:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, format="JPEG", quality=88, optimize=True)
        return dest.exists() and dest.stat().st_size >= MIN_BYTES
    except Exception:
        return False


def open_library_urls(title: str, author: str, isbn: str | None) -> list[str]:
    urls: list[str] = []
    if isbn and len(re.sub(r"\D", "", isbn)) >= 10:
        urls.append(f"https://covers.openlibrary.org/b/isbn/{urllib.parse.quote(isbn)}-L.jpg")

    cleaned = clean_title(title)
    queries = [
        f"{cleaned} {author}".strip(),
        cleaned,
        cleaned.split(":")[0].strip(),
    ]
    seen = set()
    for q in queries:
        q = q.strip()
        if len(q) < 4 or q in seen:
            continue
        seen.add(q)
        data = http_json(
            "https://openlibrary.org/search.json?"
            + urllib.parse.urlencode({"q": q, "limit": 8})
        )
        docs = (data or {}).get("docs") or []
        author_parts = [p for p in re.split(r"\s+", (author or "").lower()) if len(p) > 2]
        ranked = []
        for d in docs:
            cover_id = d.get("cover_i") or d.get("cover_id")
            if not cover_id:
                continue
            names = " ".join(d.get("author_name") or []).lower()
            score = 2 if author_parts and all(p in names for p in author_parts) else 1
            ranked.append((score, int(cover_id)))
        ranked.sort(reverse=True)
        for _, cover_id in ranked[:2]:
            urls.append(f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg")
        if urls:
            break
        time.sleep(0.15)
    # dedupe preserve order
    out, seen_u = [], set()
    for u in urls:
        if u not in seen_u:
            seen_u.add(u)
            out.append(u)
    return out


def google_books_urls(title: str, author: str) -> list[str]:
    cleaned = clean_title(title)
    q = f'intitle:"{cleaned.split(":")[0].strip()}"'
    if author:
        q += f' inauthor:"{author.split(",")[0].strip()}"'
    data = http_json(
        "https://www.googleapis.com/books/v1/volumes?"
        + urllib.parse.urlencode({"q": q, "maxResults": 5})
    )
    if not data or "items" not in data:
        return []
    urls = []
    for item in data.get("items") or []:
        links = (item.get("volumeInfo") or {}).get("imageLinks") or {}
        for key in ("extraLarge", "large", "medium", "thumbnail", "smallThumbnail"):
            u = links.get(key)
            if not u:
                continue
            u = u.replace("http://", "https://")
            # Request larger zoom when possible
            u = re.sub(r"zoom=\d", "zoom=2", u)
            urls.append(u)
            break
    return urls


def internet_archive_urls(title: str, author: str) -> list[str]:
    cleaned = clean_title(title).split(":")[0].strip()
    clauses = [f'title:({cleaned})']
    if author:
        clauses.append(f'creator:({author.split(",")[0].strip()})')
    q = " AND ".join(clauses)
    data = http_json(
        "https://archive.org/advancedsearch.php?"
        + urllib.parse.urlencode(
            {
                "q": q,
                "fl[]": "identifier",
                "rows": 5,
                "page": 1,
                "output": "json",
            }
        )
    )
    docs = (((data or {}).get("response") or {}).get("docs")) or []
    return [f"https://archive.org/services/img/{d['identifier']}" for d in docs if d.get("identifier")]


def discover_cover(title: str, author: str, isbn: str | None = None) -> tuple[bytes | None, str]:
    providers = [
        ("open-library", open_library_urls(title, author, isbn)),
        ("google-books", google_books_urls(title, author)),
        ("internet-archive", internet_archive_urls(title, author)),
    ]
    for source, urls in providers:
        for url in urls[:4]:
            data = http_get(url)
            if data and len(data) >= MIN_BYTES:
                # IA sometimes returns tiny default GIF
                if data[:3] in (b"GIF", b"gif") and len(data) < 8000:
                    continue
                return data, source
            time.sleep(0.05)
        time.sleep(0.1)
    return None, ""


def load_targets(limit: int | None) -> list[dict[str, Any]]:
    books: list[dict[str, Any]] = []
    seen = set()

    def add(b: dict[str, Any], source: str, indexed_cover: str = ""):
        slug = b.get("slug") or slugify(b.get("title") or b.get("name") or "")
        if not slug or slug in seen:
            return
        title = b.get("title") or b.get("name") or ""
        if not title or len(title) < 3:
            return
        seen.add(slug)
        books.append(
            {
                "slug": slug,
                "title": title,
                "author": b.get("author") or b.get("authors") or "",
                "isbn": b.get("isbn13") or b.get("isbn10") or b.get("isbn"),
                "source": source,
                "coverImage": indexed_cover or b.get("coverImage") or b.get("coverUrl") or "",
            }
        )

    # The previous worker only read the 1.2k curated catalogue and small
    # enrichment files. It skipped the actual 86k directory manifest and its
    # 86k cover URL index. Include those records so recovery targets the real
    # storefront catalogue rather than repeatedly processing a tiny subset.
    index_path = ROOT / "data" / "catalog" / "cover_url_index_86k.json"
    cover_index: dict[str, Any] = {}
    if index_path.exists():
        try:
            index_payload = json.loads(index_path.read_text(encoding="utf-8"))
            cover_index = index_payload.get("map") or index_payload if isinstance(index_payload, dict) else {}
        except Exception:
            cover_index = {}

    def indexed_cover_for(book: dict[str, Any]) -> str:
        keys = [
            book.get("slug"),
            f"ref:{book.get('catalogNum')}" if book.get("catalogNum") is not None else "",
            f"ref:{book.get('ref')}" if book.get("ref") is not None else "",
            str(book.get("catalogNum") or ""),
            str(book.get("ref") or ""),
            str(book.get("id") or "").replace("book-", ""),
        ]
        for key in keys:
            entry = cover_index.get(str(key)) if key else None
            if isinstance(entry, dict):
                url = entry.get("coverUrl") or entry.get("coverImage") or ""
                if isinstance(url, str) and url.startswith(("https://", "http://")):
                    return url
        return ""

    directory = ROOT / "data" / "catalog" / "directory_86k_from_pdf.json"
    if directory.exists():
        try:
            payload = json.loads(directory.read_text(encoding="utf-8"))
            if isinstance(payload, list):
                records = payload
            elif isinstance(payload, dict):
                records = next((payload.get(k) for k in ("books", "items", "documents", "records", "entries", "data") if isinstance(payload.get(k), list)), [])
            else:
                records = []
            for b in records:
                if isinstance(b, dict):
                    add(b, "directory-86k", indexed_cover_for(b))
        except Exception as exc:
            print(f"Warning: unable to read 86k directory manifest: {exc}")

    curated = ROOT / "data" / "catalog" / "curated_masterclasses_from_pdf.json"
    if curated.exists():
        payload = json.loads(curated.read_text(encoding="utf-8"))
        for b in payload.get("books") or []:
            add(b, "curated")

    enriched = ROOT / "data" / "enriched_1000_books.json"
    if enriched.exists():
        payload = json.loads(enriched.read_text(encoding="utf-8"))
        items = payload if isinstance(payload, list) else payload.get("books") or []
        for b in items:
            add(b, "enriched")

    # Homepage / featured hardcodes often live in catalog compile sources
    for name in ("master_86k_part1.json", "master_86k_part2.json"):
        p = ROOT / "data" / "catalog" / name
        if not p.exists():
            continue
        try:
            items = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        # Prefer titles that already appear in demand / have weak covers
        for b in items:
            cover = (b.get("coverImage") or b.get("coverUrl") or "")
            if cover.startswith("/covers/") and "standard-shelf" not in cover:
                # still include if local missing/synthetic later
                pass
            add(b, "master")
            if limit and len(books) >= limit * 3:
                break
        if limit and len(books) >= limit * 3:
            break

    if limit:
        books = books[:limit]
    return books


def process_one(book: dict[str, Any], overwrite_synthetic: bool) -> dict[str, Any]:
    slug = book["slug"]
    dest = COVERS_DIR / f"{slug}.jpg"
    short = COVERS_DIR / f"{slugify(clean_title(book['title']))}.jpg"

    existing = None
    for candidate in (dest, short):
        if candidate.exists():
            existing = candidate
            break
        # also try coverImage basename
    if book.get("coverImage"):
        base = Path(str(book["coverImage"]).split("?")[0]).name
        p = COVERS_DIR / base
        if p.exists():
            existing = p

    if existing and not is_synthetic_cover(existing) and not overwrite_synthetic:
        return {"slug": slug, "status": "keep_existing", "file": existing.name}

    if existing and is_synthetic_cover(existing) and not overwrite_synthetic:
        # still try to replace synthetics by default
        pass

    data, source = discover_cover(book["title"], book.get("author") or "", book.get("isbn"))
    # Prefer the repository's precomputed 86k cover index before making
    # additional discovery requests. Indexed matches still remain reviewable.
    indexed_url = str(book.get("coverImage") or "")
    if indexed_url.startswith(("https://", "http://")):
        indexed_data = http_get(indexed_url)
        if indexed_data and save_jpeg(indexed_data, dest):
            return {
                "slug": slug,
                "status": "downloaded",
                "source": "existing-86k-cover-index",
                "file": dest.name,
                "bytes": dest.stat().st_size,
                "title": book["title"],
            }

    if not data:
        return {"slug": slug, "status": "not_found", "title": book["title"]}

    # Prefer canonical slug filename; also write short title slug for fuzzy API match
    ok = save_jpeg(data, dest)
    if ok and short != dest:
        try:
            save_jpeg(data, short)
        except Exception:
            pass
    if not ok:
        return {"slug": slug, "status": "bad_image", "source": source}

    return {
        "slug": slug,
        "status": "downloaded",
        "source": source,
        "file": dest.name,
        "bytes": dest.stat().st_size,
        "title": book["title"],
    }


def patch_curated_map(results: list[dict[str, Any]]) -> int:
    curated_path = ROOT / "data" / "catalog" / "curated_masterclasses_from_pdf.json"
    if not curated_path.exists():
        return 0
    payload = json.loads(curated_path.read_text(encoding="utf-8"))
    by_slug = {r["slug"]: r for r in results if r.get("status") == "downloaded"}
    updated = 0
    for b in payload.get("books") or []:
        slug = b.get("slug")
        if slug in by_slug:
            b["coverImage"] = f"/covers/{slug}.jpg"
            # A downloaded search-result cover is not automatically an exact
            # bibliographic match. Keep it visible but pending human verification.
            b["coverVerified"] = False
            b["coverSource"] = by_slug[slug].get("source") or "free-api"
            b["coverConfidence"] = "MEDIUM"
            b["coverReviewRequired"] = True
            b["coverStatus"] = "review_required"
            b["coverType"] = "CUSTOM_ARTWORK"
            updated += 1
    if updated:
        curated_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return updated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=120, help="Max books to process this run")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--overwrite-synthetic", action="store_true", default=True)
    parser.add_argument("--offset", type=int, default=-1, help="Explicit target offset; -1 resumes from cursor")
    args = parser.parse_args()

    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    targets_all = load_targets(None)
    total_targets = len(targets_all)
    if args.offset < 0:
        try:
            cursor = json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
            offset = int(cursor.get("nextOffset", 0))
        except Exception:
            offset = 0
    else:
        offset = args.offset
    if total_targets:
        offset = offset % total_targets
    targets = targets_all[offset : offset + max(0, args.limit)]

    print(f"Targets: {len(targets)} | workers={args.workers} | covers_dir={COVERS_DIR}")
    results: list[dict[str, Any]] = []
    counts = {"downloaded": 0, "keep_existing": 0, "not_found": 0, "bad_image": 0}

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = {
            ex.submit(process_one, b, args.overwrite_synthetic): b for b in targets
        }
        for i, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            results.append(res)
            st = res.get("status", "error")
            counts[st] = counts.get(st, 0) + 1
            if i % 25 == 0 or st == "downloaded":
                print(
                    f"[{i}/{len(targets)}] {st} | {res.get('slug')} | {res.get('source','')} | {res.get('title','')[:60]}"
                )

    summary = {
        "processed": len(results),
        "counts": counts,
        "updatedCurated": patch_curated_map(results),
        "sampleDownloaded": [r for r in results if r.get("status") == "downloaded"][:20],
    }
    out = ROOT / "data" / "catalog" / "cover_backfill_summary.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    next_offset = (offset + len(targets)) % max(1, total_targets)
    cursor_payload = {
        "nextOffset": next_offset,
        "lastOffset": offset,
        "processed": len(targets),
        "totalTargets": total_targets,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "lastCounts": counts,
    }
    CURSOR_PATH.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_PATH.write_text(json.dumps(cursor_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({"offset": offset, "nextOffset": next_offset, "totalTargets": total_targets, **counts}, indent=2))
    print(f"Wrote {out}")
    print(f"Wrote {CURSOR_PATH}")


if __name__ == "__main__":
    main()
