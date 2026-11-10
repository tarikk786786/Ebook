---
name: ebook-file-extraction
description: Extract embedded covers and metadata from local PDF/EPUB/MOBI using Calibre CLI, zipfile EPUB, and PyMuPDF. Use for cover recovery pilots and local HIGH-confidence covers.
---

# Ebook file extraction

## Prefer

1. Embedded cover refs (EPUB OPF / Calibre `--get-cover`)
2. Valid image dimensions + non-dark synthetic check
3. **Do not** auto-accept PDF first page as cover without validation

## Implementation

- Primary: `scripts/lib_local_ebook_covers.py`
- EPUB: stdlib zipfile + XML (avoid AGPL EbookLib in Next.js)
- PDF: PyMuPDF in Python workers only
- MOBI/AZW: optional Calibre CLI (`winget install calibre.calibre`)
- Never modify source ebook files; never bypass DRM

## Pilot

```bash
python scripts/run_cover_recovery_batch.py --pilot 100
```

Expect evidence under `data/cover_pilot_100.json`.
