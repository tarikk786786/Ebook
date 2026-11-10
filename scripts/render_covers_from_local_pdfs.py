#!/usr/bin/env python3
"""Render cover thumbnails from local PDF files matched to all_ebooks_pdf_list.txt."""
from __future__ import annotations

import re
import sqlite3
import sys
import time
import unicodedata
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LIST_PATH = Path(r"C:\Users\tarik\Downloads\all_ebooks_pdf_list.txt")
COVERS = ROOT / "public" / "covers"
DB = ROOT / "data" / "covers_86k.sqlite"
PDF_DIRS = [
    Path(r"C:\Users\tarik\Downloads\TG\TelegramPdfExtractor\Telegram_All_Books"),
    ROOT / "private_storage",
    Path(r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\telegram-ebook-store-bot\storage"),
]
LINE_RE = re.compile(
    r"^\s*(\d+)\.\s+(.*?)\s+—\s+(.*?)\s+\[(.*?)\]\s+\((.*?)\)\s*$"
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def norm_name(name: str) -> str:
    name = unicodedata.normalize("NFKD", name or "").casefold()
    name = re.sub(r"\.pdf$", "", name)
    name = re.sub(r"[^a-z0-9]+", "", name)
    return name


def index_pdfs() -> dict[str, Path]:
    idx: dict[str, Path] = {}
    for folder in PDF_DIRS:
        if not folder.exists():
            continue
        for p in folder.rglob("*.pdf"):
            key = norm_name(p.name)
            if key and key not in idx:
                idx[key] = p
            # also stem without extension variants
            key2 = norm_name(p.stem)
            if key2 and key2 not in idx:
                idx[key2] = p
    return idx


def render_cover(pdf_path: Path, dest: Path, max_w: int = 320) -> bool:
    try:
        doc = fitz.open(pdf_path)
        try:
            page = doc[0]
            # 1.2 zoom ~72dpi*1.2
            pix = page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4), alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            w, h = img.size
            if w > max_w:
                nh = max(1, int(h * (max_w / float(w))))
                img = img.resize((max_w, nh), Image.Resampling.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            img.save(dest, format="JPEG", quality=75, optimize=True)
            return dest.exists() and dest.stat().st_size >= 2500
        finally:
            doc.close()
    except Exception:
        return False


def main():
    print("Indexing local PDFs...", flush=True)
    pdf_index = index_pdfs()
    print(f"PDF index size: {len(pdf_index)}", flush=True)

    books = []
    with LIST_PATH.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            m = LINE_RE.match(line.strip())
            if not m:
                continue
            books.append(
                {
                    "catalog_num": int(m.group(1)),
                    "title": m.group(2).strip(),
                    "file_name": m.group(5).strip(),
                }
            )
    print(f"List rows: {len(books)}", flush=True)

    conn = sqlite3.connect(DB)
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

    rendered = 0
    matched = 0
    skipped = 0
    for b in books:
        dest = COVERS / f"{b['catalog_num']}.jpg"
        if dest.exists() and dest.stat().st_size >= 4000:
            skipped += 1
            continue
        key = norm_name(b["file_name"])
        pdf = pdf_index.get(key)
        if not pdf:
            # try title-ish
            pdf = pdf_index.get(norm_name(b["title"]))
        if not pdf:
            continue
        matched += 1
        if render_cover(pdf, dest):
            rendered += 1
            now = time.time()
            conn.execute(
                """
                INSERT INTO covers(catalog_num, title, status, source, cover_url, local_path, updated_at)
                VALUES(?,?, 'found', 'local-pdf-render', ?, ?, ?)
                ON CONFLICT(catalog_num) DO UPDATE SET
                  status='found',
                  source='local-pdf-render',
                  cover_url=excluded.cover_url,
                  local_path=excluded.local_path,
                  updated_at=excluded.updated_at,
                  error=NULL
                """,
                (
                    b["catalog_num"],
                    b["title"],
                    f"/covers/{b['catalog_num']}.jpg",
                    str(dest.relative_to(ROOT)).replace("\\", "/"),
                    now,
                ),
            )
            if rendered % 50 == 0:
                conn.commit()
                print(f"rendered {rendered} (matched {matched})", flush=True)
    conn.commit()
    conn.close()
    print(
        {
            "matched": matched,
            "rendered": rendered,
            "skipped_existing": skipped,
        },
        flush=True,
    )


if __name__ == "__main__":
    main()
