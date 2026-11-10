#!/usr/bin/env python3
"""
Resumable cover recovery batch worker (CSV → local extract → Google Books → IA).

Usage:
  python scripts/build_catalog_file_map.py
  python scripts/run_cover_recovery_batch.py --limit 100 --workers 2
  python scripts/run_cover_recovery_batch.py --missing-only --limit 500

Rules:
  - Identity = catalog Index + File Name (never title alone)
  - Never overwrite status=manual or confidence=HIGH local/manual covers
  - Never delete ebook source files
  - Writes actual JPEGs under public/covers/{catalogNum}.jpg
  - Updates covers_86k.sqlite + periodically exports cover_url_index_86k.json
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import random
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib_local_ebook_covers import (  # noqa: E402
    extract_local_cover,
    find_calibre_ebook_meta,
    is_dark_or_tiny,
    save_image_bytes,
)
try:
    from cover_worker_control import wait_if_paused, write_status  # noqa: E402
except Exception:  # pragma: no cover
    def wait_if_paused(poll_s: float = 2.0) -> None:
        return None

    def write_status(patch: dict) -> None:
        return None

DB = ROOT / "data" / "covers_86k.sqlite"
MAP_PATH = ROOT / "data" / "catalog" / "catalog_file_map.json"
COVERS = ROOT / "public" / "covers"
EXPORT_PATH = ROOT / "data" / "catalog" / "cover_url_index_86k.json"
REPORT_DIR = ROOT / "data" / "reports"
UA = "AnonTroveCoverRecovery/1.0 (mailto:apnix7@gmail.com)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def log(msg: str) -> None:
    print(msg, flush=True)


def load_gb_key() -> str:
    k = (os.environ.get("GOOGLE_BOOKS_API_KEY") or "").strip()
    if k:
        return k
    env = ROOT / ".env.local"
    if not env.exists():
        return ""
    for line in env.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.strip().startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        if key.strip() == "GOOGLE_BOOKS_API_KEY":
            return val.strip().strip('"').strip("'")
    return ""


def ensure_schema(conn: sqlite3.Connection) -> None:
    cols = {r[1] for r in conn.execute("pragma table_info(covers)")}
    for col, typ in (
        ("isbn13", "TEXT"),
        ("isbn10", "TEXT"),
        ("confidence", "TEXT"),
        ("pilot_batch", "TEXT"),
        ("file_name", "TEXT"),
        ("cover_hash", "TEXT"),
    ):
        if col not in cols:
            conn.execute(f"ALTER TABLE covers ADD COLUMN {col} {typ}")
    conn.commit()


def http_json(url: str, timeout: float = 12):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def http_bytes(url: str, timeout: float = 15) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            if not data or len(data) < 2500:
                return None
            if data[:3] in (b"GIF", b"gif") and len(data) < 8000:
                return None
            return data
    except Exception:
        return None


def find_google_books(title: str, author: str, isbn13: str, key: str) -> tuple[str | None, str]:
    queries = []
    if isbn13:
        queries.append(f"isbn:{isbn13}")
    core = (title or "").split(":")[0].strip()
    core = core.split("—")[0].strip()
    q = f'intitle:"{core}"'
    if author and author.lower() not in {"editorial board", "anontrove guild", "unknown"}:
        q += f' inauthor:"{author.split(",")[0].strip()}"'
    queries.append(q)
    for query in queries:
        params = {"q": query, "maxResults": 3, "printType": "books"}
        if key:
            params["key"] = key
        data = http_json(
            "https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(params)
        )
        if not data or "items" not in data:
            continue
        for item in data.get("items") or []:
            links = (item.get("volumeInfo") or {}).get("imageLinks") or {}
            for k in ("extraLarge", "large", "medium", "thumbnail"):
                u = links.get(k)
                if u:
                    conf = "HIGH" if isbn13 else "MEDIUM"
                    return (
                        str(u).replace("http://", "https://").replace("zoom=1", "zoom=2"),
                        conf,
                    )
    return None, "LOW"


def find_open_library(title: str, author: str, isbn13: str = "") -> tuple[str | None, int | None, str]:
    if isbn13:
        url = f"https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false"
        data = http_bytes(url)
        if data:
            return url, None, "HIGH"
    core = (title or "").split(":")[0].strip()
    if len(core) < 4:
        return None, None, "LOW"
    params = {"title": core, "limit": 5}
    if author and author.lower() not in {
        "editorial board",
        "anontrove guild",
        "unknown",
        "editorial board & domain experts",
    }:
        params["author"] = author.split(",")[0].strip()
    data = http_json("https://openlibrary.org/search.json?" + urllib.parse.urlencode(params))
    for doc in (data or {}).get("docs") or []:
        cover_i = doc.get("cover_i")
        if not cover_i or int(cover_i) <= 0:
            continue
        url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg?default=false"
        blob = http_bytes(url)
        if blob:
            return url, int(cover_i), "MEDIUM"
    return None, None, "LOW"


def find_ia(title: str, author: str) -> str | None:
    core = (title or "").split(":")[0].strip()
    if len(core) < 4:
        return None
    q = f'title:("{core}")'
    data = http_json(
        "https://archive.org/advancedsearch.php?"
        + urllib.parse.urlencode({"q": q, "fl[]": "identifier", "rows": 3, "page": 1, "output": "json"})
    )
    docs = (((data or {}).get("response") or {}).get("docs")) or []
    for d in docs:
        ident = d.get("identifier")
        if not ident:
            continue
        url = f"https://archive.org/services/img/{ident}"
        if http_bytes(url):
            return url
    return None


def export_index(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        """
        SELECT catalog_num, slug, title, author, category, source, cover_url, ol_cover_id, local_path, confidence
        FROM covers
        WHERE status='found' AND cover_url IS NOT NULL AND cover_url != ''
        """
    ).fetchall()
    mapping = {}
    for catalog_num, slug, title, author, category, source, cover_url, ol_cover_id, local_path, confidence in rows:
        entry = {
            "catalogNum": catalog_num,
            "slug": slug,
            "title": title,
            "author": author,
            "category": category,
            "coverUrl": cover_url,
            "olCoverId": ol_cover_id,
            "coverSource": source,
            "localPath": local_path,
            "coverVerified": (confidence or "") == "HIGH",
            "coverConfidence": confidence,
            "coverImage": f"/covers/{catalog_num}.jpg" if local_path else cover_url,
        }
        mapping[f"ref:{catalog_num}"] = entry
        mapping[str(catalog_num)] = entry
        if slug:
            mapping[slug] = entry
    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"map": mapping, "count": len(rows)}, separators=(",", ":"), ensure_ascii=False)
    tmp = EXPORT_PATH.with_suffix(".json.tmp")
    tmp.write_text(payload, encoding="utf-8")
    for attempt in range(5):
        try:
            tmp.replace(EXPORT_PATH)
            break
        except OSError:
            time.sleep(0.4 * (attempt + 1))
    else:
        # Last resort: keep .tmp beside target so website can still be pointed later
        log(f"WARN: could not replace {EXPORT_PATH.name}; left {tmp.name}")
    log(f"Exported index count={len(rows)} -> {EXPORT_PATH.name}")


def process_one(entry: dict, gb_key: str, download_remote: bool) -> dict:
    wait_if_paused()
    catalog_num = int(entry["catalogNum"])
    title = entry.get("title") or ""
    author = entry.get("author") or ""
    slug = entry.get("slug") or str(catalog_num)
    dest = COVERS / f"{catalog_num}.jpg"
    slug_dest = COVERS / f"{slug}.jpg"

    # Protect existing good covers
    if dest.exists() and dest.stat().st_size >= 4000 and not is_dark_or_tiny(dest):
        if entry.get("dbStatus") == "found" and entry.get("dbSource") in {
            "manual",
            "calibre-ebook-meta",
            "epub-opf-zipfile",
            "pymupdf-pdf",
            "google-books",
        }:
            return {
                "catalog_num": catalog_num,
                "status": "found",
                "source": entry.get("dbSource"),
                "confidence": "HIGH",
                "skipped": True,
                "cover_url": f"/covers/{catalog_num}.jpg",
                "local_path": str(dest.relative_to(ROOT)).replace("\\", "/"),
                "isbn13": None,
                "error": None,
            }

    isbn13 = isbn10 = None
    source = None
    confidence = None
    cover_ok = False

    local_path = entry.get("localPath")
    if local_path and Path(local_path).exists():
        extracted = extract_local_cover(Path(local_path), dest)
        isbn13, isbn10 = extracted.isbn13, extracted.isbn10
        if extracted.cover_path:
            cover_ok = True
            source = extracted.source
            confidence = "HIGH"

    if not cover_ok and download_remote:
        # Stay polite to OL/IA/GB — uncontrolled fan-out causes timeouts.
        time.sleep(random.uniform(0.35, 0.9))
        # Skip Google Books when no API key — anonymous quota is exhausted (HTTP 429).
        if gb_key:
            url, conf = find_google_books(title, author, isbn13 or "", gb_key)
            if url:
                data = http_bytes(url)
                if data and save_image_bytes(data, dest):
                    cover_ok = True
                    source = "google-books"
                    confidence = conf
        if not cover_ok:
            ol_url, _ol_id, ol_conf = find_open_library(title, author, isbn13 or "")
            if ol_url:
                data = http_bytes(ol_url)
                if data and save_image_bytes(data, dest):
                    cover_ok = True
                    source = "open-library"
                    confidence = ol_conf
        if not cover_ok:
            ia = find_ia(title, author)
            if ia:
                data = http_bytes(ia)
                if data and save_image_bytes(data, dest):
                    cover_ok = True
                    source = "internet-archive"
                    confidence = "MEDIUM"

    if cover_ok and dest.exists():
        try:
            slug_dest.write_bytes(dest.read_bytes())
        except Exception:
            pass
        # Keep MEDIUM matches as found but flagged for admin review via confidence.
        return {
            "catalog_num": catalog_num,
            "status": "found",
            "review": confidence == "MEDIUM",
            "source": source,
            "confidence": confidence,
            "skipped": False,
            "cover_url": f"/covers/{catalog_num}.jpg",
            "local_path": str(dest.relative_to(ROOT)).replace("\\", "/"),
            "isbn13": isbn13,
            "isbn10": isbn10,
            "file_name": entry.get("fileName"),
            "error": None,
        }

    return {
        "catalog_num": catalog_num,
        "status": "not_found",
        "source": "not_found",
        "confidence": "LOW",
        "skipped": False,
        "cover_url": None,
        "local_path": None,
        "isbn13": isbn13,
        "isbn10": isbn10,
        "file_name": entry.get("fileName"),
        "error": "no_verified_cover",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--missing-only", action="store_true")
    ap.add_argument("--pending-from-db", action="store_true", help="Queue pending rows from covers_86k.sqlite")
    ap.add_argument("--retry-not-found", action="store_true", help="Also retry status=not_found")
    ap.add_argument("--require-local", action="store_true", help="Only rows with a mapped local ebook file")
    ap.add_argument("--no-remote", action="store_true")
    ap.add_argument("--export-every", type=int, default=50)
    args = ap.parse_args()

    if not MAP_PATH.exists():
        log("catalog_file_map.json missing — run scripts/build_catalog_file_map.py first")
        sys.exit(1)

    payload = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    mapping: dict = payload.get("map") or {}
    gb_key = load_gb_key()
    log(f"Calibre: {'yes' if find_calibre_ebook_meta() else 'no'}")
    log(f"GOOGLE_BOOKS_API_KEY: {'SET' if gb_key else 'MISSING'}")
    log(f"map entries={len(mapping)}")

    conn = sqlite3.connect(str(DB), timeout=60)
    ensure_schema(conn)

    entries = []
    if args.pending_from_db:
        # Default queue = pending only (61k). Use --retry-not-found to include misses.
        statuses = ("pending", "not_found") if args.retry_not_found else ("pending",)
        placeholders = ",".join("?" * len(statuses))
        pending_rows = conn.execute(
            f"""
            SELECT catalog_num, slug, title, author, category, status
            FROM covers
            WHERE status IN ({placeholders})
            ORDER BY catalog_num
            """,
            statuses,
        ).fetchall()
        for catalog_num, slug, title, author, category, status in pending_rows:
            key = str(catalog_num)
            base = mapping.get(key) or {}
            entries.append(
                {
                    "catalogNum": catalog_num,
                    "slug": slug or base.get("slug") or str(catalog_num),
                    "title": title or base.get("title") or "",
                    "author": author or base.get("author") or "",
                    "category": category or base.get("category") or "",
                    "fileName": base.get("fileName"),
                    "localPath": base.get("localPath"),
                    "localPaths": base.get("localPaths") or [],
                    "dbStatus": status,
                    "dbCoverUrl": None,
                }
            )
    else:
        for key in sorted(mapping.keys(), key=lambda x: int(x)):
            e = mapping[key]
            if args.require_local and not e.get("localPath"):
                continue
            if args.missing_only:
                st = (e.get("dbStatus") or "pending")
                if st == "found" and e.get("dbCoverUrl"):
                    dest = COVERS / f"{e['catalogNum']}.jpg"
                    if dest.exists() and dest.stat().st_size >= 4000 and not is_dark_or_tiny(dest):
                        continue
            entries.append(e)

    entries = entries[args.offset :]
    if args.limit > 0:
        entries = entries[: args.limit]
    log(f"batch size={len(entries)} workers={args.workers} remote={not args.no_remote}")
    write_status(
        {
            "job": "run_cover_recovery_batch",
            "queued": len(entries),
            "running": True,
            "workers": args.workers,
            "remote": not args.no_remote,
        }
    )

    recovered = miss = skipped = 0
    done = 0
    rows_out = []
    chunk_size = 100

    def work(e):
        return process_one(e, gb_key, download_remote=not args.no_remote)

    def flush(batch_rows: list[dict]) -> None:
        if not batch_rows:
            return
        conn.executemany(
            """
            UPDATE covers
            SET status=?, source=?, cover_url=?, local_path=?, isbn13=?, isbn10=?,
                confidence=?, file_name=?, error=?, updated_at=?,
                pilot_batch=COALESCE(pilot_batch, 'batch')
            WHERE catalog_num=?
            """,
            [
                (
                    b["status"],
                    b.get("source"),
                    b.get("cover_url"),
                    b.get("local_path"),
                    b.get("isbn13"),
                    b.get("isbn10"),
                    b.get("confidence"),
                    b.get("file_name"),
                    b.get("error"),
                    time.time(),
                    b["catalog_num"],
                )
                for b in batch_rows
            ],
        )
        conn.commit()

    for chunk_start in range(0, len(entries), chunk_size):
        chunk = entries[chunk_start : chunk_start + chunk_size]
        batch: list[dict] = []
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            futs = [ex.submit(work, e) for e in chunk]
            for fut in as_completed(futs):
                res = fut.result()
                batch.append(res)
                rows_out.append(res)
                done += 1
                if res.get("skipped"):
                    skipped += 1
                elif res["status"] == "found":
                    recovered += 1
                else:
                    miss += 1

                if len(batch) >= 20:
                    flush(batch)
                    batch = []

                if done % 25 == 0:
                    log(f"[{done}/{len(entries)}] recovered={recovered} miss={miss} skipped={skipped}")
                    write_status(
                        {
                            "job": "run_cover_recovery_batch",
                            "done": done,
                            "queued": len(entries),
                            "recovered": recovered,
                            "miss": miss,
                            "skipped": skipped,
                            "running": True,
                        }
                    )
                if done % max(10, args.export_every) == 0:
                    export_index(conn)
        flush(batch)
        log(f"chunk {chunk_start // chunk_size + 1} done ({min(chunk_start + chunk_size, len(entries))}/{len(entries)})")

    export_index(conn)
    totals = dict(conn.execute("SELECT status, COUNT(*) FROM covers GROUP BY status"))
    conn.close()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d_%H%M%S")
    report_json = REPORT_DIR / f"cover_recovery_batch_{stamp}.json"
    report_csv = REPORT_DIR / f"cover_recovery_batch_{stamp}.csv"
    summary = {
        "attempted": len(entries),
        "recovered": recovered,
        "miss": miss,
        "skipped": skipped,
        "db_totals": totals,
        "google_books_key": bool(gb_key),
        "calibre": bool(find_calibre_ebook_meta()),
    }
    report_json.write_text(json.dumps({"summary": summary, "rows": rows_out}, indent=2), encoding="utf-8")
    with report_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "catalog_num",
                "status",
                "source",
                "confidence",
                "cover_url",
                "local_path",
                "isbn13",
                "file_name",
                "error",
                "skipped",
            ],
        )
        w.writeheader()
        for r in rows_out:
            w.writerow({k: r.get(k) for k in w.fieldnames})

    write_status(
        {
            "job": "run_cover_recovery_batch",
            "running": False,
            "recovered": recovered,
            "miss": miss,
            "skipped": skipped,
            "db_totals": totals,
        }
    )
    log(json.dumps(summary, indent=2))
    log(f"Wrote {report_json.name} and {report_csv.name}")


if __name__ == "__main__":
    main()
