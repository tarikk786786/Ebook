# Open-Source Tools Evaluation & Architecture

**Project Reference ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`

---

## 1. Selected Open-Source Tool Stack

### A. Telegram MTProto Engine: **Telethon**
* **Repository:** [https://github.com/LonamiWebs/Telethon](https://github.com/LonamiWebs/Telethon)
* **License:** MIT
* **Why Selected:** Pure Python 3 async implementation of the Telegram MTProto protocol. Unlike Bot API (limited to 50MB files), Telethon supports up to 2GB files, persistent SQLite authorization sessions, and fine-grained iteration over channels with automated `FloodWaitError` handling.

### B. PDF & Document Extraction: **PyMuPDF (`fitz`)**
* **Repository:** [https://github.com/pymupdf/PyMuPDF](https://github.com/pymupdf/PyMuPDF)
* **License:** AGPL-3.0 / Commercial
* **Why Selected:** High-performance MuPDF bindings providing 10x-50x faster rendering than pypdf or pdfminer. Extracts first-page cover mockups at arbitrary DPI (130-150 DPI) in under 15ms per book, while reading embedded table of contents (TOC) and metadata.

### C. Image & Thumbnail Processing: **Pillow (PIL)**
* **Repository:** [https://github.com/python-pillow/Pillow](https://github.com/python-pillow/Pillow)
* **License:** HPND (Historical Permission Notice and Disclaimer)
* **Why Selected:** Zero-C-dependency modern image processing library. Used for generating fallback 3D book jackets, category color palettes, and downscaled web thumbnails.

### D. Full-Text Search: **SQLite FTS5**
* **Documentation:** [https://www.sqlite.org/fts5.html](https://www.sqlite.org/fts5.html)
* **License:** Public Domain
* **Why Selected:** Native C-speed full-text search with zero external server dependencies. Can index 10,000+ books with sub-millisecond query latency across titles, authors, and synopsis fields.

### E. Frontend Application: **Next.js 14 App Router**
* **Repository:** [https://github.com/vercel/next.js](https://github.com/vercel/next.js)
* **License:** MIT
* **Why Selected:** Static site generation (SSG) with incremental dynamic parameters (`dynamicParams = true`), instant client hydration, Tailwind CSS v3/v4 design system, and built-in edge API routing.
