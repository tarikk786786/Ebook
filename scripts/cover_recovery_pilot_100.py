#!/usr/bin/env python3
"""
100-book pilot for local-first cover recovery.

Uses lib_local_ebook_covers (Calibre CLI optional, EPUB zipfile, PyMuPDF)
then Google Books / IA only for misses when keys/network allow.

Writes:
  data/reports/cover_recovery_pilot_100.json
  data/reports/cover_recovery_pilot_100.csv
"""
from __future__ import annotations

import csv
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib_local_ebook_covers import extract_local_cover, find_calibre_ebook_meta  # noqa: E402

DB = ROOT / "data" / "covers_86k.sqlite"
COVERS = ROOT / "public" / "covers"
REPORT_JSON = ROOT / "data" / "reports" / "cover_recovery_pilot_100.json"
REPORT_CSV = ROOT / "data" / "reports" / "cover_recovery_pilot_100.csv"
PDF_DIRS = [
    Path(r"C:\Users\tarik\Downloads\TG\TelegramPdfExtractor\Telegram_All_Books"),
    ROOT / "private_storage",
    Path(r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\telegram-ebook-store-bot\storage"),
]
UA = "AnonTroveCoverPilot/1.0 (mailto:apnix7@gmail.com)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


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


def norm_name(name: str) -> str:
    name = unicodedata.normalize("NFKD", name or "").casefold()
    name = re.sub(r"\.(pdf|epub|mobi|azw3?)$", "", name)
    return re.sub(r"[^a-z0-9]+", "", name)


def index_ebooks() -> dict[str, Path]:
    idx: dict[str, Path] = {}
    exts = {".pdf", ".epub", ".mobi", ".azw", ".azw3"}
    for folder in PDF_DIRS:
        if not folder.exists():
            continue
        for p in folder.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in exts:
                continue
            key = norm_name(p.name)
            if key and key not in idx:
                idx[key] = p
            key2 = norm_name(p.stem)
            if key2 and key2 not in idx:
                idx[key2] = p
    return idx


def http_json(url: str, timeout: float = 10):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def find_google_books(title: str, author: str, isbn13: str, key: str) -> str | None:
    queries = []
    if isbn13:
        queries.append(f"isbn:{isbn13}")
    core = re.sub(r"\s*[—–-]\s*Volume\s+\d+.*$", "", title or "", flags=re.I).split(":")[0].strip()
    q = f'intitle:"{core}"'
    if author and author.lower() not in {"editorial board", "anontrove guild"}:
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
                    return str(u).replace("http://", "https://").replace("zoom=1", "zoom=2")
    return None


def download_cover(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
        if not data or len(data) < 2500:
            return False
        from lib_local_ebook_covers import save_image_bytes

        return save_image_bytes(data, dest)
    except Exception:
        return False


def ensure_schema(conn: sqlite3.Connection) -> None:
    cols = {r[1] for r in conn.execute("pragma table_info(covers)")}
    alters = []
    if "isbn13" not in cols:
        alters.append("ALTER TABLE covers ADD COLUMN isbn13 TEXT")
    if "isbn10" not in cols:
        alters.append("ALTER TABLE covers ADD COLUMN isbn10 TEXT")
    if "confidence" not in cols:
        alters.append("ALTER TABLE covers ADD COLUMN confidence TEXT")
    if "pilot_batch" not in cols:
        alters.append("ALTER TABLE covers ADD COLUMN pilot_batch TEXT")
    for sql in alters:
        conn.execute(sql)
    conn.commit()


def main(limit: int = 100) -> None:
    gb_key = load_gb_key()
    calibre = find_calibre_ebook_meta()
    print(f"Calibre ebook-meta: {'FOUND' if calibre else 'NOT INSTALLED (optional)'}")
    print(f"GOOGLE_BOOKS_API_KEY: {'SET' if gb_key else 'MISSING'}")

    print("Indexing local ebook files...")
    ebook_index = index_ebooks()
    print(f"Local ebook index: {len(ebook_index)}")

    conn = sqlite3.connect(str(DB))
    ensure_schema(conn)

    # Prefer pending with file-match potential; otherwise any pending
    pending = conn.execute(
        """
        SELECT catalog_num, slug, title, author, status, source, cover_url
        FROM covers
        WHERE status IN ('pending','not_found')
        ORDER BY catalog_num
        LIMIT ?
        """,
        (limit * 5,),
    ).fetchall()

    selected = []
    for row in pending:
        catalog_num, slug, title, author, status, source, cover_url = row
        keys = [norm_name(title or ""), norm_name(slug or "")]
        hit = None
        for k in keys:
            if k and k in ebook_index:
                hit = ebook_index[k]
                break
        selected.append((row, hit))
        if len(selected) >= limit:
            break

    # If fewer than limit matched locally, still process up to limit pending
    if len(selected) < limit:
        for row in pending:
            if any(r[0][0] == row[0] for r in selected):
                continue
            selected.append((row, None))
            if len(selected) >= limit:
                break

    results = []
    recovered = 0
    local_hits = 0
    remote_hits = 0
    misses = 0
    skipped_existing = 0

    for row, local_file in selected:
        catalog_num, slug, title, author, status, source, cover_url = row
        dest = COVERS / f"{catalog_num}.jpg"
        slug_dest = COVERS / f"{slug}.jpg" if slug else None

        # Never replace an existing non-dark cover that is already found
        if status == "found" and dest.exists() and dest.stat().st_size >= 4000:
            skipped_existing += 1
            results.append(
                {
                    "catalog_num": catalog_num,
                    "title": title,
                    "outcome": "skipped_existing",
                    "source": source,
                }
            )
            continue

        outcome = {
            "catalog_num": catalog_num,
            "slug": slug,
            "title": title,
            "author": author,
            "local_file": str(local_file) if local_file else None,
            "outcome": "miss",
            "source": None,
            "isbn13": None,
            "confidence": None,
        }

        cover_ok = False
        isbn13 = isbn10 = None
        conf = None
        src = None

        if local_file:
            extracted = extract_local_cover(local_file, dest)
            isbn13, isbn10 = extracted.isbn13, extracted.isbn10
            if extracted.cover_path:
                cover_ok = True
                local_hits += 1
                src = extracted.source
                conf = "HIGH"
                if slug_dest:
                    slug_dest.write_bytes(dest.read_bytes())

        if not cover_ok and (isbn13 or title):
            time.sleep(0.15)
            url = find_google_books(title or "", author or "", isbn13 or "", gb_key)
            if url and download_cover(url, dest):
                cover_ok = True
                remote_hits += 1
                src = "google-books"
                conf = "HIGH" if isbn13 else "MEDIUM"
                if slug_dest:
                    slug_dest.write_bytes(dest.read_bytes())

        if cover_ok:
            recovered += 1
            outcome.update(
                {
                    "outcome": "recovered",
                    "source": src,
                    "isbn13": isbn13,
                    "confidence": conf,
                    "cover": f"/covers/{catalog_num}.jpg",
                }
            )
            conn.execute(
                """
                UPDATE covers
                SET status='found', source=?, cover_url=?, local_path=?, isbn13=?, isbn10=?,
                    confidence=?, pilot_batch='pilot_100', error=NULL, updated_at=?
                WHERE catalog_num=?
                """,
                (
                    src,
                    f"/covers/{catalog_num}.jpg",
                    str(dest.relative_to(ROOT)).replace("\\", "/"),
                    isbn13,
                    isbn10,
                    conf,
                    time.time(),
                    catalog_num,
                ),
            )
        else:
            misses += 1
            outcome["outcome"] = "miss"
            conn.execute(
                """
                UPDATE covers
                SET status=CASE WHEN status='found' THEN status ELSE 'not_found' END,
                    error=?, pilot_batch='pilot_100', isbn13=COALESCE(?, isbn13),
                    isbn10=COALESCE(?, isbn10), updated_at=?
                WHERE catalog_num=?
                """,
                ("pilot_miss", isbn13, isbn10, time.time(), catalog_num),
            )

        results.append(outcome)
        if len(results) % 10 == 0:
            conn.commit()
            print(f"[{len(results)}/{len(selected)}] recovered={recovered} miss={misses}")

    conn.commit()
    totals = dict(conn.execute("SELECT status, COUNT(*) FROM covers GROUP BY status"))
    conn.close()

    report = {
        "pilot": "cover_recovery_pilot_100",
        "attempted": len(selected),
        "recovered": recovered,
        "local_hits": local_hits,
        "remote_hits": remote_hits,
        "misses": misses,
        "skipped_existing": skipped_existing,
        "calibre_available": bool(calibre),
        "google_books_key": bool(gb_key),
        "local_ebook_index_size": len(ebook_index),
        "accuracy_proxy_pct": round((recovered / max(1, len(selected))) * 100, 1),
        "db_totals_after": totals,
        "tools": {
            "calibre": "optional CLI ebook-meta --get-cover",
            "epub": "zipfile+OPF (EbookLib-inspired, no AGPL import in app)",
            "pdf": "PyMuPDF first-page / embedded images",
            "isbn": "BookMeta-style regex on PDF/EPUB text",
            "remote": "Google Books when key present",
            "skipped_apps": ["aloglu/bookshelf (UI only)", "kiwilan/php-ebook (PHP)", "BookMeta Flask app"],
        },
        "results": results,
    }
    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    with REPORT_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "catalog_num",
                "slug",
                "title",
                "author",
                "outcome",
                "source",
                "isbn13",
                "confidence",
                "local_file",
            ],
        )
        w.writeheader()
        for r in results:
            w.writerow({k: r.get(k) for k in w.fieldnames})

    print(json.dumps({k: report[k] for k in report if k != "results"}, indent=2))
    print(f"Wrote {REPORT_JSON}")
    print(f"Wrote {REPORT_CSV}")


if __name__ == "__main__":
    lim = 100
    if len(sys.argv) > 1:
        lim = int(sys.argv[1])
    main(lim)
