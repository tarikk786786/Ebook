#!/usr/bin/env python3
"""
Fetch cover identities for ALL 86,260 ebooks from all_ebooks_pdf_list.txt.

Stores results in data/covers_86k.sqlite (resumable) and periodically exports
data/catalog/cover_url_index_86k.json for the Next.js /api/covers route.

Sources (free):
  1) Open Library search API
  2) Google Books volumes API (no key; soft-fail on 429)
  3) Internet Archive services/img

Optional: --download-thumbs writes small JPEGs into public/covers/{id}.jpg
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LIST_PATH = Path(r"C:\Users\tarik\Downloads\all_ebooks_pdf_list.txt")
DB_PATH = ROOT / "data" / "covers_86k.sqlite"
EXPORT_PATH = ROOT / "data" / "catalog" / "cover_url_index_86k.json"
COVERS_DIR = ROOT / "public" / "covers"
UA = "AnonTrove86kCoverBot/1.0 (mailto:apnix7@gmail.com)"
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
    books = []
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
                n = int(m2.group(1))
                title = clean_title(m2.group(2))
                books.append(
                    {
                        "catalog_num": n,
                        "title": title,
                        "author": "",
                        "category": "",
                        "slug": slugify(title),
                    }
                )
                continue
            n = int(m.group(1))
            title = clean_title(m.group(2))
            author = (m.group(3) or "").strip()
            category = (m.group(4) or "").strip()
            books.append(
                {
                    "catalog_num": n,
                    "title": title,
                    "author": author,
                    "category": category,
                    "slug": slugify(title),
                }
            )
    return books


def db_connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=60)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS covers (
          catalog_num INTEGER PRIMARY KEY,
          slug TEXT,
          title TEXT,
          author TEXT,
          category TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          source TEXT,
          cover_url TEXT,
          ol_cover_id INTEGER,
          local_path TEXT,
          error TEXT,
          updated_at REAL
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_covers_status ON covers(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_covers_slug ON covers(slug)")
    conn.commit()
    return conn


def http_json(url: str, timeout: float = 8):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception:
        return None


def http_bytes(url: str, timeout: float = 10) -> bytes | None:
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


def find_open_library(title: str, author: str) -> tuple[str | None, int | None]:
    # OL search is often unreachable from some networks; keep a single short attempt.
    cleaned = clean_title(title)
    q = f"{cleaned} {author}".strip()[:120]
    if len(q) < 4:
        return None, None
    data = http_json(
        "https://openlibrary.org/search.json?"
        + urllib.parse.urlencode({"q": q, "limit": 5}),
        timeout=4,
    )
    docs = (data or {}).get("docs") or []
    for d in docs:
        cid = d.get("cover_i")
        if cid:
            return f"https://covers.openlibrary.org/b/id/{int(cid)}-M.jpg", int(cid)
    return None, None


def find_google_books(title: str, author: str) -> str | None:
    cleaned = clean_title(title).split(":")[0].strip()
    q = f'intitle:"{cleaned}"'
    if author and author.lower() not in {"editorial board", "anontrove guild", "editorial board & domain experts"}:
        q += f' inauthor:"{author.split(",")[0].strip()}"'
    data = http_json(
        "https://www.googleapis.com/books/v1/volumes?"
        + urllib.parse.urlencode({"q": q, "maxResults": 3}),
        timeout=6,
    )
    if not data or "items" not in data:
        return None
    for item in data.get("items") or []:
        links = (item.get("volumeInfo") or {}).get("imageLinks") or {}
        for key in ("large", "medium", "thumbnail", "smallThumbnail"):
            u = links.get(key)
            if u:
                return str(u).replace("http://", "https://").replace("zoom=1", "zoom=2")
    return None


def find_internet_archive(title: str, author: str) -> str | None:
    cleaned = clean_title(title).split(":")[0].strip()
    if len(cleaned) < 4:
        return None
    # Title-only first (higher recall); author filter often over-constrains.
    queries = [f'title:("{cleaned}")', f'title:({cleaned})']
    if author and author.lower() not in {
        "editorial board",
        "anontrove guild",
        "editorial board & domain experts",
        "anontrove engineering guild",
    }:
        queries.insert(0, f'title:("{cleaned}") AND creator:({author.split(",")[0].strip()})')
    for q in queries:
        data = http_json(
            "https://archive.org/advancedsearch.php?"
            + urllib.parse.urlencode(
                {"q": q, "fl[]": "identifier", "rows": 5, "page": 1, "output": "json"}
            ),
            timeout=8,
        )
        docs = (((data or {}).get("response") or {}).get("docs")) or []
        for d in docs:
            ident = d.get("identifier")
            if not ident:
                continue
            # Validate image exists / non-tiny
            img_url = f"https://archive.org/services/img/{ident}"
            probe = http_bytes(img_url, timeout=8)
            if probe:
                return img_url
    return None


def resolve_cover(title: str, author: str) -> tuple[str, str | None, int | None]:
    # Priority based on current network health: IA works, GB rate-limits, OL search times out.
    url = find_internet_archive(title, author)
    if url:
        return "internet-archive", url, None
    url = find_google_books(title, author)
    if url:
        return "google-books", url, None
    url, ol_id = find_open_library(title, author)
    if url:
        return "open-library", url, ol_id
    return "not_found", None, None


def save_thumb(url: str, dest: Path) -> bool:
    data = http_bytes(url)
    if not data:
        return False
    try:
        im = Image.open(BytesIO(data)).convert("RGB")
        w, h = im.size
        max_w = 280
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=72, optimize=True)
        return dest.exists() and dest.stat().st_size >= 2000
    except Exception:
        return False


def export_index(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        """
        SELECT catalog_num, slug, title, author, category, source, cover_url, ol_cover_id, local_path, status
        FROM covers
        WHERE status='found' AND cover_url IS NOT NULL AND cover_url != ''
        """
    ).fetchall()
    mapping = {}
    for catalog_num, slug, title, author, category, source, cover_url, ol_cover_id, local_path, status in rows:
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
            "coverVerified": True,
            # Prefer local path for site when downloaded; else remote CDN URL for API
            "coverImage": f"/covers/{catalog_num}.jpg" if local_path else cover_url,
        }
        mapping[f"ref:{catalog_num}"] = entry
        if slug:
            mapping[slug] = entry
        mapping[str(catalog_num)] = entry
    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXPORT_PATH.write_text(
        json.dumps({"map": mapping, "count": len(rows)}, separators=(",", ":"), ensure_ascii=False),
        encoding="utf-8",
    )
    log(f"Exported {len(rows)} covers -> {EXPORT_PATH} ({EXPORT_PATH.stat().st_size/1e6:.2f} MB)")


def seed_db(conn: sqlite3.Connection, books: list[dict]) -> None:
    now = time.time()
    conn.executemany(
        """
        INSERT OR IGNORE INTO covers(catalog_num, slug, title, author, category, status, updated_at)
        VALUES(?,?,?,?,?,'pending',?)
        """,
        [
            (
                b["catalog_num"],
                b["slug"],
                b["title"],
                b.get("author") or "",
                b.get("category") or "",
                now,
            )
            for b in books
        ],
    )
    # refresh metadata for existing rows
    conn.executemany(
        """
        UPDATE covers SET slug=?, title=?, author=?, category=? WHERE catalog_num=?
        """,
        [
            (
                b["slug"],
                b["title"],
                b.get("author") or "",
                b.get("category") or "",
                b["catalog_num"],
            )
            for b in books
        ],
    )
    # Mark already-present local numeric covers as found (skip re-fetch)
    local_updates = []
    for b in books:
        n = b["catalog_num"]
        local = COVERS_DIR / f"{n}.jpg"
        slug_local = COVERS_DIR / f"{b['slug']}.jpg"
        book_cover = ROOT / "public" / "book-covers" / f"{n}.jpg"
        chosen = None
        for candidate in (local, slug_local, book_cover):
            if candidate.exists() and candidate.stat().st_size >= 4000:
                chosen = candidate
                break
        if not chosen:
            continue
        rel = str(chosen.relative_to(ROOT)).replace("\\", "/")
        local_updates.append(
            (
                "found",
                "local-disk",
                f"/covers/{n}.jpg",
                rel,
                now,
                n,
            )
        )
    if local_updates:
        conn.executemany(
            """
            UPDATE covers
            SET status=?, source=?, cover_url=?, local_path=?, updated_at=?, error=NULL
            WHERE catalog_num=? AND status!='found'
            """,
            local_updates,
        )
        log(f"Seeded {len(local_updates)} covers from local disk")
    conn.commit()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0, help="0 = all pending")
    ap.add_argument("--download-thumbs", action="store_true")
    ap.add_argument("--export-every", type=int, default=200)
    ap.add_argument("--retry-not-found", action="store_true")
    args = ap.parse_args()

    log(f"Parsing list {LIST_PATH}")
    books = parse_list(LIST_PATH)
    log(f"Parsed {len(books)} books")

    conn = db_connect()
    seed_db(conn, books)

    statuses = ("pending", "not_found") if args.retry_not_found else ("pending",)
    placeholders = ",".join("?" * len(statuses))
    pending = conn.execute(
        f"""
        SELECT catalog_num, slug, title, author
        FROM covers
        WHERE status IN ({placeholders})
        ORDER BY catalog_num
        """,
        statuses,
    ).fetchall()
    if args.limit and args.limit > 0:
        pending = pending[: args.limit]
    log(f"Pending to resolve: {len(pending)} | workers={args.workers} | thumbs={args.download_thumbs}")

    def work(row):
        catalog_num, slug, title, author = row
        # jitter to reduce synchronized rate limits
        time.sleep(random.uniform(0.01, 0.08))
        source, url, ol_id = resolve_cover(title, author or "")
        local_path = None
        if url and args.download_thumbs:
            dest = COVERS_DIR / f"{catalog_num}.jpg"
            if save_thumb(url, dest):
                local_path = str(dest.relative_to(ROOT)).replace("\\", "/")
                # also slug copy for fuzzy API
                if slug:
                    save_thumb(url, COVERS_DIR / f"{slug}.jpg")
        status = "found" if url else "not_found"
        return {
            "catalog_num": catalog_num,
            "status": status,
            "source": source,
            "cover_url": url,
            "ol_cover_id": ol_id,
            "local_path": local_path,
            "error": None if url else "no_cover",
            "updated_at": time.time(),
        }

    found = 0
    miss = 0
    done = 0
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = {ex.submit(work, row): row[0] for row in pending}
        batch = []
        for fut in as_completed(futs):
            res = fut.result()
            batch.append(res)
            done += 1
            if res["status"] == "found":
                found += 1
            else:
                miss += 1
            if len(batch) >= 40:
                conn.executemany(
                    """
                    UPDATE covers
                    SET status=?, source=?, cover_url=?, ol_cover_id=?, local_path=?, error=?, updated_at=?
                    WHERE catalog_num=?
                    """,
                    [
                        (
                            b["status"],
                            b["source"],
                            b["cover_url"],
                            b["ol_cover_id"],
                            b["local_path"],
                            b["error"],
                            b["updated_at"],
                            b["catalog_num"],
                        )
                        for b in batch
                    ],
                )
                conn.commit()
                batch = []
            if done % 50 == 0:
                log(f"[{done}/{len(pending)}] found={found} miss={miss}")
            if done % max(50, args.export_every) == 0:
                export_index(conn)

        if batch:
            conn.executemany(
                """
                UPDATE covers
                SET status=?, source=?, cover_url=?, ol_cover_id=?, local_path=?, error=?, updated_at=?
                WHERE catalog_num=?
                """,
                [
                    (
                        b["status"],
                        b["source"],
                        b["cover_url"],
                        b["ol_cover_id"],
                        b["local_path"],
                        b["error"],
                        b["updated_at"],
                        b["catalog_num"],
                    )
                    for b in batch
                ],
            )
            conn.commit()

    export_index(conn)
    totals = dict(conn.execute("SELECT status, COUNT(*) FROM covers GROUP BY status").fetchall())
    log(f"DONE totals={totals}")
    conn.close()


if __name__ == "__main__":
    main()
