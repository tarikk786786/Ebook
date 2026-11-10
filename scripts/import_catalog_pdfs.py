#!/usr/bin/env python3
"""Import AnonTrove catalog PDFs into JSON used by the Next.js storefront.

Sources:
  - AnonTrove_Curated_Masterclasses_Catalog.pdf  → rich PDP fields (price/pages/author/file)
  - AnonTrove_Complete_86k_Ebooks_Directory.pdf → title+category overlay for 86k index

Also matches local files in public/covers/ for real thumbnails when available.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

try:
    import fitz
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Missing PyMuPDF. Install with: python -m pip install pymupdf") from exc

ROOT = Path(__file__).resolve().parents[1]
TG = Path(r"C:\Users\tarik\Downloads\TG")
OUT_DIR = ROOT / "data" / "catalog"
COVERS_DIR = ROOT / "public" / "covers"

MASTERCLASSES_PDF = TG / "AnonTrove_Curated_Masterclasses_Catalog.pdf"
DIRECTORY_PDF = TG / "AnonTrove_Complete_86k_Ebooks_Directory.pdf"


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def build_cover_index() -> dict[str, str]:
    index: dict[str, str] = {}
    if not COVERS_DIR.is_dir():
        return index
    for path in COVERS_DIR.iterdir():
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            index[path.stem.lower()] = path.name
    return index


def resolve_cover(stem: str, cover_index: dict[str, str]) -> tuple[str, bool]:
    key = stem.lower()
    name = cover_index.get(key)
    if not name:
        prefix = key[:40]
        for candidate, filename in cover_index.items():
            if candidate.startswith(prefix) or prefix.startswith(candidate[:40]):
                name = filename
                break
    if name:
        return f"/covers/{name}", True
    return f"/api/covers/{key}", False


def pdf_text(path: Path) -> str:
    doc = fitz.open(path)
    try:
        return "\n".join(page.get_text("text") for page in doc)
    finally:
        doc.close()


def parse_masterclasses(text: str, cover_index: dict[str, str]) -> list[dict]:
    entries: list[dict] = []
    current_cat = "Uncategorized"
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("Category:"):
            current_cat = line.split(":", 1)[1].strip() or current_cat
            i += 1
            continue

        match = re.match(r"^#(\d+)\.\s*(.+)$", line)
        if not match:
            i += 1
            continue

        catalog_num = int(match.group(1))
        title = match.group(2).strip()
        price = 49
        pages = 0
        author = "AnonTrove Guild"
        file_name = ""
        note = ""
        file_size = ""

        for offset in range(1, 6):
            if i + offset >= len(lines):
                break
            look = lines[i + offset].strip()
            price_match = re.match(r"INR\s*[·•\.]?\s*(\d+)\s*\((\d+)p\)", look)
            if price_match:
                price = int(price_match.group(1))
                pages = int(price_match.group(2))
                continue
            author_match = re.match(r"Author:\s*(.*?)\s*\|\s*File:\s*(.+)$", look)
            if author_match:
                author = author_match.group(1).strip() or author
                file_name = author_match.group(2).strip()
                continue
            if look.startswith("Note:"):
                note = look[5:].strip()
                size_match = re.search(r"(\d+(?:\.\d+)?)\s*(KB|MB|GB)", note, re.I)
                if size_match:
                    file_size = f"{size_match.group(1)} {size_match.group(2).upper()}"

        stem = slugify(Path(file_name).stem if file_name else title)
        cover_image, verified = resolve_cover(stem, cover_index)
        entries.append(
            {
                "id": f"book-curated-{stem}"[:64],
                "slug": stem,
                "catalogNum": catalog_num,
                "title": title,
                "author": author,
                "category": current_cat,
                "priceInInr": price,
                "originalPriceInInr": max(price * 4, price + 50),
                "pages": pages or 120,
                "fileName": file_name or f"{stem}.pdf",
                "fileSize": file_size or "—",
                "note": note,
                "description": (
                    f"{title} by {author}. Curated AnonTrove masterclass edition "
                    f"({pages or 'n/a'} pages). DRM-free PDF with instant delivery."
                ),
                "coverImage": cover_image,
                "coverVerified": verified,
                "coverType": "AUTHENTIC" if verified else "CUSTOM_ARTWORK",
                "collection": "LATEST_STARTUP",
                "sourceCatalog": MASTERCLASSES_PDF.name,
                "badge": (
                    "Featured"
                    if catalog_num <= 25
                    else "Recommended"
                    if catalog_num <= 100
                    else "Curated"
                ),
                "status": "PUBLISHED",
            }
        )
        i += 1
    return entries


def parse_directory(text: str) -> list[dict]:
    """Parse the 86k master directory into lightweight title/category records."""
    entries: list[dict] = []
    current_cat = "General"
    # Category headers look like: [AI & DATA SCIENCE]
    cat_re = re.compile(r"^\[([^\]]+)\]\s*$")
    # Numbered lines: 2. 002) Course Details...  OR  123. Title
    item_re = re.compile(r"^\d+\.\s*(?:\d+\)\s*)?(.+)$")

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        cat_match = cat_re.match(line)
        if cat_match:
            current_cat = cat_match.group(1).strip()
            continue
        if line.startswith("ANONTROVE") or line.startswith("Page ") or line.startswith("https://"):
            continue
        item_match = item_re.match(line)
        if not item_match:
            continue
        title = item_match.group(1).strip()
        if len(title) < 3:
            continue
        stem = slugify(title)
        entries.append(
            {
                "id": f"book-dir-{stem}"[:64],
                "slug": stem,
                "title": title,
                "category": current_cat,
                "sourceCatalog": DIRECTORY_PDF.name,
            }
        )
    # Deduplicate by slug keeping first occurrence
    seen: set[str] = set()
    unique: list[dict] = []
    for entry in entries:
        if entry["slug"] in seen:
            continue
        seen.add(entry["slug"])
        unique.append(entry)
    return unique


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cover_index = build_cover_index()
    print(f"Local covers indexed: {len(cover_index)}")

    if not MASTERCLASSES_PDF.is_file():
        raise SystemExit(f"Missing PDF: {MASTERCLASSES_PDF}")
    if not DIRECTORY_PDF.is_file():
        raise SystemExit(f"Missing PDF: {DIRECTORY_PDF}")

    curated = parse_masterclasses(pdf_text(MASTERCLASSES_PDF), cover_index)
    curated_path = OUT_DIR / "curated_masterclasses_from_pdf.json"
    curated_path.write_text(
        json.dumps(
            {
                "generatedFrom": MASTERCLASSES_PDF.name,
                "count": len(curated),
                "coverMatched": sum(1 for b in curated if b.get("coverVerified")),
                "books": curated,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(
        f"Curated masterclasses: {len(curated)} "
        f"(covers matched {sum(1 for b in curated if b.get('coverVerified'))}) → {curated_path}"
    )

    directory = parse_directory(pdf_text(DIRECTORY_PDF))
    # Attach cover hints for directory titles when a local cover exists
    for entry in directory:
        cover_image, verified = resolve_cover(entry["slug"], cover_index)
        entry["coverImage"] = cover_image
        entry["coverVerified"] = verified

    directory_path = OUT_DIR / "directory_86k_from_pdf.json"
    directory_path.write_text(
        json.dumps(
            {
                "generatedFrom": DIRECTORY_PDF.name,
                "count": len(directory),
                "coverMatched": sum(1 for b in directory if b.get("coverVerified")),
                "books": directory,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(
        f"86k directory titles: {len(directory)} "
        f"(covers matched {sum(1 for b in directory if b.get('coverVerified'))}) → {directory_path}"
    )


if __name__ == "__main__":
    main()
