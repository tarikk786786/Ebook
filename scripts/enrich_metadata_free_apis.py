#!/usr/bin/env python3
"""Conservative, resumable Open Library metadata enrichment for the 86k archive.

Only exact-title matches with corroborating author or ISBN evidence are merged
into the storefront overlay. Ambiguous candidates are written to a review queue.
No title, author, publisher, year, ISBN, page count, or description is invented.
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "data" / "catalog"
MASTER_FILES = [CATALOG_DIR / "master_86k_part1.json", CATALOG_DIR / "master_86k_part2.json"]
OVERLAY_PATH = CATALOG_DIR / "verified_metadata_overlay_86k.json"
REVIEW_PATH = CATALOG_DIR / "metadata_review_queue_86k.json"
CURSOR_PATH = CATALOG_DIR / "metadata_enrichment_cursor.json"
REPORT_PATH = ROOT / "data" / "reports" / "metadata_enrichment_latest.json"
UA = "AnonTroveMetadataEnrichment/1.0 (educational catalogue; mailto:apnix7@gmail.com)"
GENERIC_AUTHORS = {"", "unknown", "unknown author", "editorial board", "anontrove guild", "anontrove curators", "editorial board & domain experts", "n/a", "na"}
GENERIC_DESCRIPTIONS = ("comprehensive drm-free digital", "comprehensive digital study", "comprehensive edition of", "a foundational technical work")

def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").casefold()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())

def is_generic_author(value: str) -> bool:
    return norm(value) in {norm(x) for x in GENERIC_AUTHORS} or "anontrove" in norm(value)

def is_generic_description(value: str) -> bool:
    v = (value or "").strip().casefold()
    return not v or any(v.startswith(prefix) for prefix in GENERIC_DESCRIPTIONS)

def valid_isbn(value: str) -> bool:
    digits = re.sub(r"[^0-9Xx]", "", value or "").upper()
    return len(digits) == 13 and digits.startswith(("978", "979")) or len(digits) == 10 and bool(re.fullmatch(r"[0-9]{9}[0-9X]", digits))

def load_master() -> list[dict[str, Any]]:
    books = []
    seen = set()
    for path in MASTER_FILES:
        if not path.exists():
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            continue
        for item in payload:
            if not isinstance(item, dict) or not item.get("title") or not item.get("slug"):
                continue
            key = str(item.get("ref") or item.get("id") or item.get("slug"))
            if key in seen:
                continue
            seen.add(key)
            books.append(item)
    return books

def get_json(url: str, attempts: int = 3) -> dict[str, Any] | None:
    for attempt in range(attempts):
        try:
            # Open Library asks automated clients to keep request volume modest.
            # The scheduled workflow uses one worker; this delay avoids burst traffic.
            time.sleep(1.0)
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=18) as response:
                raw = response.read()
            return json.loads(raw.decode("utf-8", errors="replace"))
        except Exception:
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1) + random.random())
    return None

def extract_description(work_key: str) -> str | None:
    if not work_key.startswith("/works/"):
        return None
    data = get_json("https://openlibrary.org" + work_key + ".json", attempts=2)
    desc = (data or {}).get("description")
    if isinstance(desc, dict):
        desc = desc.get("value")
    if isinstance(desc, str) and len(desc.strip()) >= 80:
        return desc.strip()[:4000]
    return None

def search_candidate(book: dict[str, Any]) -> dict[str, Any]:
    title = str(book.get("title") or "").strip()
    author = str(book.get("author") or "").strip()
    isbn = str(book.get("isbn13") or book.get("isbn") or book.get("isbn10") or "").strip()
    title_key = norm(title)
    if len(title_key) < 4:
        return {"status": "skipped", "reason": "title_too_short", "book": book}

    query = {"title": title, "limit": 10}
    if not is_generic_author(author):
        query["author"] = author.split(",")[0].strip()
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(query)
    data = get_json(url)
    if data is None:
        return {"status": "error", "reason": "open_library_unavailable", "book": book}

    docs = (data.get("docs") or [])[:10]
    exact_title = [d for d in docs if norm(str(d.get("title") or "")) == title_key]
    if not exact_title:
        return {"status": "not_found", "book": book}

    source_isbns = {re.sub(r"[^0-9Xx]", "", isbn).upper()} if valid_isbn(isbn) else set()
    scored = []
    for doc in exact_title:
        doc_isbns = {re.sub(r"[^0-9Xx]", "", str(x)).upper() for x in (doc.get("isbn") or [])}
        isbn_match = bool(source_isbns and source_isbns.intersection(doc_isbns))
        authors = [str(x).strip() for x in (doc.get("author_name") or []) if str(x).strip()]
        author_match = False
        if not is_generic_author(author) and authors:
            src_author = norm(author)
            author_match = any(norm(a) == src_author or (len(norm(a)) >= 4 and norm(a) in src_author) for a in authors)
        confidence = "HIGH" if isbn_match or author_match else "MEDIUM"
        scored.append((2 if isbn_match else 1 if author_match else 0, doc, authors, confidence, isbn_match, author_match))
    scored.sort(key=lambda x: x[0], reverse=True)
    best = scored[0]
    _, doc, authors, confidence, isbn_match, author_match = best
    if confidence != "HIGH":
        suggestions = {
            "slug": book.get("slug"),
            "catalogNum": book.get("ref"),
            "title": title,
            "currentAuthor": author,
            "suggestedAuthors": authors,
            "suggestedPublisher": (doc.get("publisher") or [None])[0],
            "suggestedYear": doc.get("first_publish_year"),
            "suggestedIsbns": (doc.get("isbn") or [])[:5],
            "sourceUrl": "https://openlibrary.org" + str(doc.get("key") or ""),
            "reason": "exact_title_without_matching_author_or_isbn",
            "status": "manual_review",
        }
        return {"status": "review", "suggestion": suggestions, "book": book}

    result: dict[str, Any] = {
        "slug": book.get("slug"),
        "catalogNum": book.get("ref"),
        "metadataConfidence": "HIGH",
        "metadataReviewRequired": False,
        "metadataSource": "open-library",
        "metadataSourceUrl": "https://openlibrary.org" + str(doc.get("key") or ""),
        "metadataVerifiedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    if is_generic_author(author) and authors:
        result["author"] = "; ".join(authors[:4])
    publishers = [str(x).strip() for x in (doc.get("publisher") or []) if str(x).strip()]
    if not book.get("publisher") and publishers:
        result["publisher"] = publishers[0]
    year = doc.get("first_publish_year")
    if not book.get("publishedYear") and isinstance(year, int) and 1400 <= year <= 2100:
        result["publishedYear"] = year
    page_count = doc.get("number_of_pages_median")
    if not book.get("pages") and isinstance(page_count, int) and 1 <= page_count <= 20000:
        result["pages"] = page_count
    isbns = [str(x) for x in (doc.get("isbn") or [])]
    if not book.get("isbn13"):
        result["isbn13"] = next((x for x in isbns if len(re.sub(r"\D", "", x)) == 13), None)
    if not book.get("isbn10"):
        result["isbn10"] = next((x for x in isbns if len(re.sub(r"\D", "", x)) == 10), None)
    langs = [str(x) for x in (doc.get("language") or []) if str(x)]
    if not book.get("language") and langs:
        result["language"] = langs[0]
    current_desc = str(book.get("description") or "")
    if is_generic_description(current_desc):
        description = extract_description(str(doc.get("key") or ""))
        if description:
            result["description"] = description
    result = {k: v for k, v in result.items() if v is not None}
    return {"status": "verified", "entry": result, "book": book}

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=250)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--offset", type=int, default=-1, help="-1 resumes from saved cursor")
    args = parser.parse_args()

    books = load_master()
    total = len(books)
    if not total:
        raise SystemExit("No master catalogue records found; expected data/catalog/master_86k_part1.json and part2.json")

    try:
        cursor = json.loads(CURSOR_PATH.read_text(encoding="utf-8"))
    except Exception:
        cursor = {}
    offset = int(cursor.get("nextOffset", 0)) if args.offset < 0 else args.offset
    offset %= total

    review_queue = []
    if REVIEW_PATH.exists():
        try:
            review_queue = json.loads(REVIEW_PATH.read_text(encoding="utf-8"))
        except Exception:
            review_queue = []
    old_retry = cursor.get("retryKeys") or []
    retry_keys = set(str(x) for x in old_retry)
    retry_books = [b for b in books if str(b.get("ref") or b.get("id") or b.get("slug")) in retry_keys]
    selected_by_key = {str(b.get("ref") or b.get("id") or b.get("slug")): b for b in retry_books[:args.limit]}
    next_scan = offset
    while len(selected_by_key) < args.limit and len(selected_by_key) < total:
        book = books[next_scan]
        key = str(book.get("ref") or book.get("id") or book.get("slug"))
        selected_by_key.setdefault(key, book)
        next_scan = (next_scan + 1) % total
        if next_scan == offset:
            break
    selected = list(selected_by_key.values())

    try:
        overlay_payload = json.loads(OVERLAY_PATH.read_text(encoding="utf-8"))
        overlay = overlay_payload.get("map") or {}
    except Exception:
        overlay = {}

    retry_next = set(retry_keys)
    review_by_key = {str(x.get("slug")): x for x in review_queue if isinstance(x, dict) and x.get("slug")}
    counts = {"verified": 0, "review": 0, "not_found": 0, "error": 0, "skipped": 0}
    completed_keys = set()

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(search_candidate, b): b for b in selected}
        for future in as_completed(futures):
            result = future.result()
            book = result.get("book") or futures[future]
            key = str(book.get("ref") or book.get("id") or book.get("slug"))
            completed_keys.add(key)
            status = result.get("status", "error")
            counts[status] = counts.get(status, 0) + 1
            if status == "verified":
                entry = result["entry"]
                slug = str(entry.get("slug") or book.get("slug") or "")
                if slug:
                    overlay[slug] = entry
                if entry.get("catalogNum") is not None:
                    overlay[f"ref:{entry['catalogNum']}"] = entry
                retry_next.discard(key)
                review_by_key.pop(slug, None)
            elif status == "review":
                suggestion = result.get("suggestion") or {}
                slug = str(suggestion.get("slug") or book.get("slug") or "")
                if slug:
                    review_by_key[slug] = suggestion
                retry_next.discard(key)
            elif status == "error":
                retry_next.add(key)
            else:
                retry_next.discard(key)

    OVERLAY_PATH.parent.mkdir(parents=True, exist_ok=True)
    OVERLAY_PATH.write_text(json.dumps({"map": overlay, "count": len(overlay)}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    REVIEW_PATH.write_text(json.dumps(list(review_by_key.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    next_cursor = {
        "nextOffset": next_scan,
        "lastOffset": offset,
        "processed": len(selected),
        "totalTargets": total,
        "retryKeys": sorted(retry_next)[:5000],
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "lastCounts": counts,
    }
    CURSOR_PATH.write_text(json.dumps(next_cursor, ensure_ascii=False, indent=2), encoding="utf-8")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report = {"offset": offset, "nextOffset": next_scan, "totalTargets": total, "processed": len(selected), "counts": counts, "verifiedOverlayEntries": len(overlay), "manualReviewQueue": len(review_by_key), "provider": "Open Library"}
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
