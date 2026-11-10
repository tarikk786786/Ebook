#!/usr/bin/env python3
"""Full catalog enrichment from AnonTrove TG PDFs + local cover libraries.

1. Re-parse Curated Masterclasses PDF (details: price/pages/author/file)
2. Re-parse Complete 86k Directory PDF (all catalog numbers + titles + categories)
3. Match thumbnails from public/covers and public/book-covers
4. Patch master_86k_part1/2 coverImage + category where improved
5. Rewrite curated_masterclasses_from_pdf.json and directory_86k_from_pdf.json
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
BOOK_COVERS_DIR = ROOT / "public" / "book-covers"
MASTERCLASSES_PDF = TG / "AnonTrove_Curated_Masterclasses_Catalog.pdf"
DIRECTORY_PDF = TG / "AnonTrove_Complete_86k_Ebooks_Directory.pdf"
PART1 = OUT_DIR / "master_86k_part1.json"
PART2 = OUT_DIR / "master_86k_part2.json"


def slugify(value: str, max_len: int = 80) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return (text[:max_len] or "book").rstrip("-")


def normalize_title(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "").casefold()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def pdf_text(path: Path) -> str:
    doc = fitz.open(path)
    try:
        return "\n".join(page.get_text("text") for page in doc)
    finally:
        doc.close()


def build_cover_indexes() -> tuple[dict[str, str], dict[str, str], dict[str, str]]:
    """Return (stem->/covers/file, stem->/book-covers/file, norm_title->path)."""
    covers: dict[str, str] = {}
    book_covers: dict[str, str] = {}
    by_title: dict[str, str] = {}

    if COVERS_DIR.is_dir():
        for path in COVERS_DIR.iterdir():
            if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                stem = path.stem.lower()
                url = f"/covers/{path.name}"
                covers[stem] = url
                by_title.setdefault(normalize_title(path.stem), url)

    if BOOK_COVERS_DIR.is_dir():
        for path in BOOK_COVERS_DIR.iterdir():
            if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                stem = path.stem.lower()
                url = f"/book-covers/{path.name}"
                book_covers[stem] = url
                by_title.setdefault(normalize_title(path.stem), url)

    return covers, book_covers, by_title


def resolve_cover(
    *,
    slug: str,
    title: str,
    ref: str | int | None,
    file_name: str | None,
    covers: dict[str, str],
    book_covers: dict[str, str],
    by_title: dict[str, str],
) -> tuple[str, bool, str]:
    candidates: list[str] = []
    if slug:
        candidates.append(slug.lower())
    if file_name:
        candidates.append(slugify(Path(file_name).stem))
    if title:
        candidates.append(slugify(title))

    for key in candidates:
        if not key:
            continue
        if key in covers:
            return covers[key], True, "public/covers"
        if key in book_covers:
            return book_covers[key], True, "public/book-covers"
        # Strict prefix only: both sides long enough, and cover stem starts with book key
        # (avoids mapping "167. Salary..." -> "/covers/1.jpg")
        if len(key) >= 24:
            for stem, url in covers.items():
                if len(stem) >= 24 and stem.startswith(key[:40]):
                    return url, True, "public/covers-prefix-strict"

    title_key = normalize_title(title)
    if title_key and len(title_key) >= 8 and title_key in by_title:
        return by_title[title_key], True, "title-normalize"

    if ref is not None:
        ref_s = str(ref).strip()
        if ref_s in book_covers:
            return book_covers[ref_s], True, "book-covers-ref"
        # also try zero-padded
        if ref_s.isdigit():
            for width in (3, 4, 5):
                padded = ref_s.zfill(width)
                if padded in book_covers:
                    return book_covers[padded], True, "book-covers-ref-padded"

    api = f"/api/covers/{slug or slugify(title)}"
    return api, False, "api-covers"


def parse_masterclasses(text: str, covers, book_covers, by_title) -> list[dict]:
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
        pages = 120
        author = "AnonTrove Guild"
        file_name = ""
        note = ""
        file_size = "—"

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
        cover_image, verified, source = resolve_cover(
            slug=stem,
            title=title,
            ref=catalog_num,
            file_name=file_name,
            covers=covers,
            book_covers=book_covers,
            by_title=by_title,
        )
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
                "pages": pages,
                "fileName": file_name or f"{stem}.pdf",
                "fileSize": file_size,
                "note": note,
                "description": (
                    f"{title} by {author}. Curated AnonTrove masterclass edition "
                    f"({pages} pages). DRM-free PDF with instant delivery."
                ),
                "coverImage": cover_image,
                "coverVerified": verified,
                "coverSource": source,
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


def parse_directory(text: str, covers, book_covers, by_title) -> list[dict]:
    """Parse every numbered line from the 86k directory PDF (no slug dedupe)."""
    entries: list[dict] = []
    current_cat = "General"
    cat_re = re.compile(r"^\[([^\]]+)\]\s*$")
    item_re = re.compile(r"^(\d+)\.\s*(.+)$")

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        cat_match = cat_re.match(line)
        if cat_match:
            current_cat = cat_match.group(1).strip()
            continue
        if (
            line.startswith("ANONTROVE")
            or line.startswith("Page ")
            or line.startswith("https://")
            or line.startswith("Key Statistics")
            or line.startswith("·")
            or line.startswith("DISTRIBU")
            or line.startswith("THE UNIVERSAL")
            or line.startswith("This master")
            or line.startswith("Complete 86")
            or line.startswith("MASTER EBOOK")
        ):
            continue

        item_match = item_re.match(line)
        if not item_match:
            continue

        catalog_num = int(item_match.group(1))
        title = item_match.group(2).strip()
        # strip leading "002) " style prefixes when present
        title = re.sub(r"^\d+\)\s*", "", title).strip()
        if len(title) < 2:
            continue

        stem = slugify(title)
        cover_image, verified, source = resolve_cover(
            slug=stem,
            title=title,
            ref=catalog_num,
            file_name=None,
            covers=covers,
            book_covers=book_covers,
            by_title=by_title,
        )
        entries.append(
            {
                "id": f"book-{stem}"[:64],
                "slug": stem,
                "catalogNum": catalog_num,
                "ref": catalog_num,
                "title": title,
                "category": current_cat,
                "coverImage": cover_image,
                "coverVerified": verified,
                "coverSource": source,
                "sourceCatalog": DIRECTORY_PDF.name,
            }
        )
    return entries


def existing_cover_is_exact(cover: str, slug: str, title: str, ref) -> bool:
    if not cover:
        return False
    if cover.startswith("/public/"):
        return False
    if "standard-shelf-cover" in cover:
        return False
    if cover.startswith("/api/covers/"):
        return False
    stem = Path(cover).stem.lower()
    if cover.startswith("/covers/") or cover.startswith("/book-covers/"):
        if stem == slug or stem == slugify(title):
            return True
        if ref is not None and stem == str(ref).strip():
            return True
        # allow long cover stem that starts with slug (truncated filenames)
        if len(slug) >= 24 and stem.startswith(slug[:40]):
            return True
    return False


def fix_and_enrich_master(books: list[dict], covers, book_covers, by_title, dir_by_slug: dict, dir_by_ref: dict) -> dict:
    stats = {
        "total": len(books),
        "fixedPublicPrefix": 0,
        "matchedLocal": 0,
        "setApiFallback": 0,
        "keptExisting": 0,
        "categoryUpdated": 0,
        "clearedBadMatch": 0,
    }

    for book in books:
        slug = (book.get("slug") or slugify(book.get("title", ""))).lower()
        title = book.get("title") or ""
        ref = book.get("ref")
        cover = str(book.get("coverImage") or book.get("coverUrl") or "")

        # Fix broken /public/book-covers paths
        if cover.startswith("/public/"):
            cover = cover[len("/public") :]
            book["coverImage"] = cover
            stats["fixedPublicPrefix"] += 1

        overlay = dir_by_slug.get(slug)
        if overlay is None and (isinstance(ref, int) or str(ref).isdigit()):
            overlay = dir_by_ref.get(int(ref))

        if overlay and overlay.get("category") and (
            not book.get("category") or book.get("category") in {"General", "General & Technical Reference"}
        ):
            book["category"] = overlay["category"]
            stats["categoryUpdated"] += 1

        # Prefer verified overlay / local library resolution
        if overlay and overlay.get("coverVerified") and overlay.get("coverImage"):
            book["coverImage"] = overlay["coverImage"]
            book["coverType"] = "AUTHENTIC"
            book["coverVerified"] = True
            book["coverSource"] = overlay.get("coverSource") or "pdf-overlay"
            stats["matchedLocal"] += 1
            continue

        resolved, verified, source = resolve_cover(
            slug=slug,
            title=title,
            ref=ref,
            file_name=book.get("fileName"),
            covers=covers,
            book_covers=book_covers,
            by_title=by_title,
        )

        if verified:
            book["coverImage"] = resolved
            book["coverType"] = "AUTHENTIC"
            book["coverVerified"] = True
            book["coverSource"] = source
            stats["matchedLocal"] += 1
            continue

        if existing_cover_is_exact(cover, slug, title, ref):
            book["coverVerified"] = True
            book["coverType"] = "AUTHENTIC"
            stats["keptExisting"] += 1
            continue

        # Drop previous bad/loose matches and use dynamic cover API
        if cover and cover.startswith("/covers/") and not existing_cover_is_exact(cover, slug, title, ref):
            stats["clearedBadMatch"] += 1
        book["coverImage"] = resolved
        book["coverType"] = "CUSTOM_ARTWORK"
        book["coverVerified"] = False
        book["coverSource"] = source
        stats["setApiFallback"] += 1

    return stats


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    covers, book_covers, by_title = build_cover_indexes()
    print(f"Indexed covers={len(covers)} book_covers={len(book_covers)} title_keys={len(by_title)}")

    if not MASTERCLASSES_PDF.is_file() or not DIRECTORY_PDF.is_file():
        raise SystemExit("TG catalog PDFs not found")

    curated = parse_masterclasses(pdf_text(MASTERCLASSES_PDF), covers, book_covers, by_title)
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
        ),
        encoding="utf-8",
    )
    print(
        f"Curated: {len(curated)} coverMatched={sum(1 for b in curated if b.get('coverVerified'))}"
    )

    directory = parse_directory(pdf_text(DIRECTORY_PDF), covers, book_covers, by_title)
    directory_path = OUT_DIR / "directory_86k_from_pdf.json"
    # Keep full directory for offline tooling, but also emit a slim runtime cover map
    directory_path.write_text(
        json.dumps(
            {
                "generatedFrom": DIRECTORY_PDF.name,
                "count": len(directory),
                "coverMatched": sum(1 for b in directory if b.get("coverVerified")),
                "uniqueSlugs": len({b["slug"] for b in directory}),
                "books": directory,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    cover_map = {}
    for entry in directory:
        if entry.get("coverVerified") and entry.get("slug") and entry.get("coverImage"):
            # Prefer first exact/strict match per slug
            if entry["slug"] not in cover_map:
                cover_map[entry["slug"]] = {
                    "coverImage": entry["coverImage"],
                    "coverVerified": True,
                    "title": entry.get("title"),
                    "category": entry.get("category"),
                    "catalogNum": entry.get("catalogNum"),
                }
    for entry in curated:
        if entry.get("coverVerified") and entry.get("slug"):
            cover_map[entry["slug"]] = {
                "coverImage": entry["coverImage"],
                "coverVerified": True,
                "title": entry.get("title"),
                "category": entry.get("category"),
                "catalogNum": entry.get("catalogNum"),
                "priceInInr": entry.get("priceInInr"),
                "pages": entry.get("pages"),
                "author": entry.get("author"),
                "fileName": entry.get("fileName"),
                "fileSize": entry.get("fileSize"),
                "description": entry.get("description"),
            }
    cover_map_path = OUT_DIR / "cover_map_from_pdfs.json"
    cover_map_path.write_text(
        json.dumps(
            {
                "count": len(cover_map),
                "map": cover_map,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(
        f"Directory: {len(directory)} uniqueSlugs={len({b['slug'] for b in directory})} "
        f"coverMatched={sum(1 for b in directory if b.get('coverVerified'))} "
        f"slimCoverMap={len(cover_map)}"
    )

    dir_by_slug = {}
    dir_by_ref = {}
    for entry in directory:
        # Prefer verified covers when duplicate slugs exist
        prev = dir_by_slug.get(entry["slug"])
        if not prev or (entry.get("coverVerified") and not prev.get("coverVerified")):
            dir_by_slug[entry["slug"]] = entry
        dir_by_ref[int(entry["catalogNum"])] = entry

    # Also merge curated into slug overlay (richer details + covers)
    for entry in curated:
        prev = dir_by_slug.get(entry["slug"])
        if not prev or entry.get("coverVerified"):
            dir_by_slug[entry["slug"]] = {
                **(prev or {}),
                **entry,
                "coverVerified": entry.get("coverVerified"),
                "coverImage": entry.get("coverImage"),
                "category": entry.get("category") or (prev or {}).get("category"),
            }

    part1 = json.loads(PART1.read_text(encoding="utf-8"))
    part2 = json.loads(PART2.read_text(encoding="utf-8"))
    stats1 = fix_and_enrich_master(part1, covers, book_covers, by_title, dir_by_slug, dir_by_ref)
    stats2 = fix_and_enrich_master(part2, covers, book_covers, by_title, dir_by_slug, dir_by_ref)

    PART1.write_text(json.dumps(part1, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    PART2.write_text(json.dumps(part2, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    summary = {
        "curatedCount": len(curated),
        "curatedCoverMatched": sum(1 for b in curated if b.get("coverVerified")),
        "directoryCount": len(directory),
        "directoryCoverMatched": sum(1 for b in directory if b.get("coverVerified")),
        "part1": stats1,
        "part2": stats2,
    }
    (OUT_DIR / "cover_enrichment_summary.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
