#!/usr/bin/env python3
"""
Local ebook cover + ISBN extraction helpers.

Inspired by (not vendored):
  - Calibre `ebook-meta --get-cover` (GPL CLI, optional subprocess)
  - BookMeta ISBN scanning patterns (EPUB/PDF copyright pages)
  - EbookLib cover concepts (AGPL — reimplemented via zipfile/XML)
  - PyMuPDF first-page render (already used in AnonTrove)

Never deletes source ebook files. Never overwrites without caller checks.
"""
from __future__ import annotations

import io
import re
import shutil
import subprocess
import zipfile
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageStat

ISBN_RE = re.compile(
    r"(?:ISBN(?:-1[03])?[:\s]*)?(97[89][-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d|"
    r"\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?[\dXx])",
    re.I,
)


@dataclass
class LocalExtractResult:
    cover_path: Path | None = None
    source: str | None = None
    isbn13: str | None = None
    isbn10: str | None = None
    title: str | None = None
    author: str | None = None
    error: str | None = None


def find_calibre_ebook_meta() -> str | None:
    which = shutil.which("ebook-meta") or shutil.which("ebook-meta.exe")
    if which:
        return which
    for candidate in (
        Path(r"C:\Program Files\Calibre2\ebook-meta.exe"),
        Path(r"C:\Program Files (x86)\Calibre2\ebook-meta.exe"),
    ):
        if candidate.exists():
            return str(candidate)
    return None


def normalize_isbn(raw: str) -> tuple[str | None, str | None]:
    digits = re.sub(r"[^0-9Xx]", "", raw or "").upper()
    if len(digits) == 13 and digits.startswith(("978", "979")) and digits.isdigit():
        return digits, None
    if len(digits) == 10 and re.fullmatch(r"[0-9]{9}[0-9X]", digits):
        return None, digits
    return None, None


def extract_isbns_from_text(text: str) -> tuple[str | None, str | None]:
    isbn13 = isbn10 = None
    for m in ISBN_RE.finditer(text or ""):
        a, b = normalize_isbn(m.group(0))
        if a and not isbn13:
            isbn13 = a
        if b and not isbn10:
            isbn10 = b
        if isbn13 and isbn10:
            break
    return isbn13, isbn10


def is_dark_or_tiny(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 2500:
        return True
    try:
        im = Image.open(path).convert("RGB").resize((48, 64))
        st = ImageStat.Stat(im)
        mean = sum(st.mean) / 3.0
        var = sum(st.var) / 3.0
        return mean < 45 and var < 900
    except Exception:
        return True


def save_image_bytes(data: bytes, dest: Path, max_w: int = 600) -> bool:
    try:
        im = Image.open(io.BytesIO(data)).convert("RGB")
        w, h = im.size
        if w < 40 or h < 40:
            return False
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            im = im.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, format="JPEG", quality=85, optimize=True)
        return dest.exists() and not is_dark_or_tiny(dest)
    except Exception:
        return False


def extract_epub_cover_zipfile(epub_path: Path, dest: Path) -> bool:
    """EPUB cover via zipfile + OPF (EbookLib-inspired, no AGPL import)."""
    try:
        with zipfile.ZipFile(epub_path, "r") as zf:
            names = zf.namelist()
            opf_name = None
            for n in names:
                if n.lower().endswith(".opf"):
                    opf_name = n
                    break
            if not opf_name and "META-INF/container.xml" in names:
                container = zf.read("META-INF/container.xml")
                root = ET.fromstring(container)
                for el in root.iter():
                    if el.tag.endswith("rootfile") and el.attrib.get("full-path"):
                        opf_name = el.attrib["full-path"]
                        break
            cover_href = None
            if opf_name:
                opf = ET.fromstring(zf.read(opf_name))
                # meta name="cover" content="id"
                cover_id = None
                for el in opf.iter():
                    if el.tag.endswith("meta") and el.attrib.get("name", "").lower() == "cover":
                        cover_id = el.attrib.get("content")
                        break
                for el in opf.iter():
                    if not el.tag.endswith("item"):
                        continue
                    props = (el.attrib.get("properties") or "").lower()
                    iid = el.attrib.get("id")
                    href = el.attrib.get("href")
                    if not href:
                        continue
                    if "cover-image" in props or (cover_id and iid == cover_id):
                        cover_href = href
                        break
                if not cover_href:
                    for el in opf.iter():
                        if el.tag.endswith("item"):
                            href = el.attrib.get("href") or ""
                            mt = (el.attrib.get("media-type") or "").lower()
                            if mt.startswith("image/") and "cover" in href.lower():
                                cover_href = href
                                break
                if cover_href:
                    base = str(Path(opf_name).parent).replace("\\", "/")
                    if base in (".", ""):
                        candidate = cover_href
                    else:
                        candidate = f"{base}/{cover_href}".replace("//", "/")
                    # normalize relative
                    parts = []
                    for p in candidate.split("/"):
                        if p in ("", "."):
                            continue
                        if p == "..":
                            if parts:
                                parts.pop()
                            continue
                        parts.append(p)
                    candidate = "/".join(parts)
                    for key in (candidate, cover_href, f"OEBPS/{cover_href}"):
                        if key in zf.namelist():
                            return save_image_bytes(zf.read(key), dest)
            # fallback: largest image in archive
            best = None
            best_size = 0
            for n in names:
                low = n.lower()
                if low.endswith((".jpg", ".jpeg", ".png", ".webp")):
                    info = zf.getinfo(n)
                    if info.file_size > best_size:
                        best_size = info.file_size
                        best = n
            if best and best_size >= 4000:
                return save_image_bytes(zf.read(best), dest)
    except Exception:
        return False
    return False


def extract_pdf_cover_pymupdf(pdf_path: Path, dest: Path) -> bool:
    try:
        import fitz
    except ImportError:
        return False
    try:
        doc = fitz.open(pdf_path)
        try:
            page = doc[0]
            # Prefer embedded images on first page that look like covers
            images = page.get_images(full=True) or []
            for img in images[:5]:
                xref = img[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n >= 5:  # CMYK etc
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    data = pix.tobytes("jpeg")
                    if save_image_bytes(data, dest):
                        return True
                except Exception:
                    continue
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            w, h = img.size
            if w > 600:
                nh = max(1, int(h * (600 / float(w))))
                img = img.resize((600, nh), Image.Resampling.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            img.save(dest, format="JPEG", quality=85, optimize=True)
            return not is_dark_or_tiny(dest)
        finally:
            doc.close()
    except Exception:
        return False


def extract_isbns_from_pdf(pdf_path: Path) -> tuple[str | None, str | None]:
    try:
        import fitz
    except ImportError:
        return None, None
    try:
        doc = fitz.open(pdf_path)
        try:
            text = ""
            for i in range(min(5, doc.page_count)):
                text += doc[i].get_text("text") + "\n"
            return extract_isbns_from_text(text)
        finally:
            doc.close()
    except Exception:
        return None, None


def extract_isbns_from_epub(epub_path: Path) -> tuple[str | None, str | None]:
    try:
        with zipfile.ZipFile(epub_path, "r") as zf:
            text_chunks = []
            for n in zf.namelist():
                low = n.lower()
                if low.endswith((".opf", ".xhtml", ".html", ".htm", ".ncx")):
                    try:
                        raw = zf.read(n).decode("utf-8", errors="ignore")
                    except Exception:
                        continue
                    text_chunks.append(raw)
                    if len(text_chunks) >= 12:
                        break
            return extract_isbns_from_text("\n".join(text_chunks))
    except Exception:
        return None, None


def extract_via_calibre(ebook_path: Path, dest: Path) -> bool:
    meta = find_calibre_ebook_meta()
    if not meta:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Calibre writes the cover file path given to --get-cover
    try:
        proc = subprocess.run(
            [meta, str(ebook_path), "--get-cover", str(dest)],
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        if proc.returncode != 0:
            return False
        if dest.exists() and dest.stat().st_size >= 2500 and not is_dark_or_tiny(dest):
            return True
        # sometimes calibre writes .png
        png = dest.with_suffix(".png")
        if png.exists():
            data = png.read_bytes()
            png.unlink(missing_ok=True)
            return save_image_bytes(data, dest)
    except Exception:
        return False
    return False


def extract_local_cover(ebook_path: Path, dest: Path) -> LocalExtractResult:
    result = LocalExtractResult()
    if not ebook_path.exists():
        result.error = "missing_file"
        return result

    suffix = ebook_path.suffix.lower()
    tmp = dest.with_suffix(".tmp.jpg")

    # Prefer Calibre when available (handles MOBI/AZW/EPUB well)
    if extract_via_calibre(ebook_path, tmp):
        tmp.replace(dest)
        result.cover_path = dest
        result.source = "calibre-ebook-meta"
    elif suffix == ".epub" and extract_epub_cover_zipfile(ebook_path, tmp):
        tmp.replace(dest)
        result.cover_path = dest
        result.source = "epub-opf-zipfile"
    elif suffix == ".pdf" and extract_pdf_cover_pymupdf(ebook_path, tmp):
        tmp.replace(dest)
        result.cover_path = dest
        result.source = "pymupdf-pdf"
    else:
        tmp.unlink(missing_ok=True)
        if not result.cover_path:
            result.error = "no_local_cover"

    if suffix == ".pdf":
        result.isbn13, result.isbn10 = extract_isbns_from_pdf(ebook_path)
    elif suffix == ".epub":
        result.isbn13, result.isbn10 = extract_isbns_from_epub(ebook_path)

    return result
