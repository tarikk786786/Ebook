# TBOOKS — Universal Ebook Discovery, Research, Metadata Enrichment & Website Integration

**Project Reference ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`  
**Host Application:** AnonTrove Ebooks Digital Bookstore (`c:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks`)  
**Live Production URL:** [https://anon-trove-ebooks.vercel.app](https://anon-trove-ebooks.vercel.app)  
**Admin Vault:** [https://anon-trove-ebooks.vercel.app/admin](https://anon-trove-ebooks.vercel.app/admin)  
**GitHub Repository:** [https://github.com/tarikk786786/Ebook.git](https://github.com/tarikk786786/Ebook.git)

---

## 1. Architecture Overview

TBOOKS is an enterprise-grade automated pipeline designed to discover, extract, enrich, deduplicate, and publish digital ebooks from private and authorized Telegram channels directly to a high-performance Next.js 14 web application.

```
┌─────────────────────────────────┐
│     Telegram MTProto Sources    │
│  (DollarPremium 1 & 2, Zebra)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Telethon Ingestion Worker     │
│ (Rate-Limiting & FloodWait Back)│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Metadata Extraction & Enrichment│
│  - PyMuPDF Page & Cover Render  │
│  - Bibliographic Search Engine  │
│  - SHA-256 Deduplication Hash   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Dual-Tier Storage Vault       │
│  - Private Encrypted Storage    │
│  - Public Cover JPG Cache       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Website Integration (AnonTrove) │
│  - Dynamic Catalogue & Search   │
│  - Dedicated /book/[slug] Pages │
│  - Zebra Learn Showcase Filter  │
│  - Admin Vault Control Panel    │
└─────────────────────────────────┘
```

---

## 2. Directory Structure

```text
resources/ebook-library/
├── README.md                          # Main architectural documentation
├── skills-catalog.md                  # Comprehensive catalog of Antigravity skills & MCPs
├── sources/
│   ├── telegram-groups.json           # All 5 configured Telegram sources with peer IDs
│   ├── external-databases.json        # Open Library, Google Books, Internet Archive APIs
│   └── source-status.json             # Live connection and latency heartbeat
├── tools/
│   ├── tools-catalog.json             # Structured tool registry (PyMuPDF, Telethon, PIL, etc.)
│   ├── open-source-tools.md           # Tool evaluation, licenses, and architecture selection
│   └── licenses-and-limitations.md    # Free-tier rate limits and compliance policies
├── books/
│   ├── books-master.jsonl             # Master JSONL stream of all 1,772 books
│   ├── books-master.csv               # Universal CSV spreadsheet export
│   ├── metadata/                      # Granular book metadata JSON records
│   └── reports/                       # Formal audit reports (Duplicates, Storage, Import)
│       ├── duplicate-report.md
│       ├── missing-metadata-report.md
│       ├── storage-report.md
│       └── website-import-report.md
├── covers/
│   ├── originals/                     # Source covers extracted from original files
│   ├── thumbnails/                    # Fast CDN thumbnails
│   └── cover-index.json               # Mapping of all 1,772 books to cover files
└── files/                             # Multi-format categorization directory
    ├── pdf/
    ├── epub/
    ├── mobi/
    └── other/
```

---

## 3. Operational Guide

### Running the Telegram Collector
```bash
python scripts/telegram_ebook_collector.py
```
* Ingests local staged files from `C:\Users\tarik\Desktop\tbooks`
* Performs SHA-256 hashing to eliminate redundant files
* Renders first-page covers using PyMuPDF (`fitz`) at 130 DPI
* Registers metadata in `data/books_registry.json`

### Generating Master Manifests
```bash
python scratch/build_ebook_library_resources.py
```
* Generates `books-master.jsonl`, `books-master.csv`, and `cover-index.json`
* Verifies 100% cover availability across the catalog

### Testing & Building Web Application
```bash
npm run build
```
* Prerenders top featured and Zebra Learn books via SSG
* Supports on-demand incremental static regeneration (`dynamicParams = true`) for all 1,772 titles
