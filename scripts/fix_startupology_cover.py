#!/usr/bin/env python3
"""Replace synthetic Startupology cover with a real first-page PDF render or IA art."""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[1]
COVERS = ROOT / "public" / "covers"
OUTS = [
    COVERS / "startupology.jpg",
    COVERS / "startupology-by-vivek-chadha.jpg",
]
UA = {"User-Agent": "AnonTroveCoverFix/1.0"}
PDF_DIRS = [
    Path(r"C:\Users\tarik\Downloads\TG\TelegramPdfExtractor\Telegram_All_Books"),
    ROOT / "private_storage",
    Path(r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\telegram-ebook-store-bot\storage"),
    Path(r"C:\Users\tarik\Downloads\TG"),
]


def find_pdf() -> Path | None:
    hits = []
    for root in PDF_DIRS:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.is_file() and "startupology" in p.name.lower() and p.suffix.lower() == ".pdf":
                hits.append(p)
    if not hits:
        return None
    hits.sort(key=lambda p: p.stat().st_size, reverse=True)
    return hits[0]


def is_synthetic(path: Path) -> bool:
    if not path.exists():
        return True
    im = Image.open(path).convert("RGB").resize((48, 64))
    st = ImageStat.Stat(im)
    mean = sum(st.mean) / 3.0
    var = sum(st.var) / 3.0
    return mean < 45 and var < 900


def render_pdf(pdf: Path, dest: Path) -> bool:
    doc = fitz.open(pdf)
    try:
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        w, h = img.size
        max_w = 600
        if w > max_w:
            nh = max(1, int(h * (max_w / float(w))))
            img = img.resize((max_w, nh), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, format="JPEG", quality=85, optimize=True)
        return dest.exists() and dest.stat().st_size > 8000 and not is_synthetic(dest)
    finally:
        doc.close()


def try_internet_archive(dest: Path) -> bool:
    queries = [
        'title:("Startupology")',
        "title:(Startupology Chadha)",
        "title:(Startupology)",
    ]
    for q in queries:
        url = "https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(
            {"q": q, "fl[]": "identifier", "rows": 5, "page": 1, "output": "json"}
        )
        try:
            raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=12).read()
            docs = json.loads(raw).get("response", {}).get("docs", [])
        except Exception:
            continue
        for d in docs:
            ident = d.get("identifier")
            if not ident:
                continue
            img_url = f"https://archive.org/services/img/{ident}"
            try:
                data = urllib.request.urlopen(
                    urllib.request.Request(img_url, headers=UA), timeout=12
                ).read()
            except Exception:
                continue
            if not data or len(data) < 4000:
                continue
            try:
                img = Image.open(BytesIO(data)).convert("RGB")
                w, h = img.size
                if w > 600:
                    nh = max(1, int(h * (600 / float(w))))
                    img = img.resize((600, nh), Image.Resampling.LANCZOS)
                img.save(dest, format="JPEG", quality=85, optimize=True)
                if dest.exists() and dest.stat().st_size > 4000 and not is_synthetic(dest):
                    print("IA cover", ident, dest)
                    return True
            except Exception:
                continue
    return False


def make_publisher_style(dest: Path) -> None:
    """Clean non-dark cover if no PDF/IA art exists."""
    w, h = 600, 900
    img = Image.new("RGB", (w, h), "#F4F0E6")
    draw = ImageDraw.Draw(img)
    draw.rectangle([28, 28, w - 28, h - 28], outline="#1F2937", width=3)
    draw.rectangle([28, 28, w - 28, 160], fill="#0F766E")
    try:
        font_title = ImageFont.truetype("arial.ttf", 54)
        font_sub = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = font_title
        font_small = font_title
    draw.text((50, 70), "STARTUPOLOGY", fill="white", font=font_title)
    draw.text((50, 220), "Your Day One Startup Manual", fill="#111827", font=font_sub)
    draw.text((50, 270), "From Idea to Thriving Business", fill="#374151", font=font_small)
    draw.text((50, 360), "By Vivek Chadha", fill="#0F766E", font=font_sub)
    draw.rectangle([50, 430, 250, 436], fill="#0F766E")
    draw.text((50, 480), "Business & Startups", fill="#4B5563", font=font_small)
    draw.text((50, 520), "DRM-Free Digital Edition", fill="#4B5563", font=font_small)
    draw.text((50, 820), "AnonTrove Archive", fill="#6B7280", font=font_small)
    img.save(dest, format="JPEG", quality=88, optimize=True)
    print("generated publisher-style", dest)


def main():
    pdf = find_pdf()
    print("pdf", pdf)
    source_ok = False
    temp = COVERS / "_startupology_tmp.jpg"

    if pdf and render_pdf(pdf, temp):
        source_ok = True
        print("rendered from pdf")
    elif try_internet_archive(temp):
        source_ok = True
        print("downloaded from IA")
    else:
        make_publisher_style(temp)
        source_ok = True
        print("fallback generated")

    if source_ok and temp.exists():
        data = temp.read_bytes()
        for out in OUTS:
            out.write_bytes(data)
            print("wrote", out, out.stat().st_size, "synthetic=", is_synthetic(out))
        temp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
