# Universal Ebook Discovery Engine — Next Actions & Roadmap

## Continuous Execution Roadmap

### 1. High Priority (Current Sprint)
- [x] Integrate `/admin/scraper` control plane with zero-trust token authentication.
- [x] Implement multi-source discovery across Open Library, Internet Archive, and Telegram vault.
- [x] Build public `/discover` interface with format, source, and rights filters.
- [x] Connect `/admin` main navigation to Tools Manager and Universal Scraper.
- [x] Create comprehensive architectural and security documentation in `docs/universal-scraper/`.
- [ ] Run full production build verification (`npm run build`).
- [ ] Deploy updates to Vercel production and verify HTTP 200 on all routes.

### 2. Medium Term (Next Sprint)
- **OPDS Ingestion Pipeline**: Add automated Atom XML feed parsing for Standard Ebooks and Feedbooks catalog syndication.
- **DOAB & arXiv Connectors**: Expand open-access academic monographs and preprint paper indexing.
- **Enhanced OCR Engine**: Connect local OCRmyPDF / Tesseract workers for deep indexing of scanned public domain document pages.
- **Elastic / Meilisearch Indexing**: For ultra-fast full-text search as catalog scales beyond 10,000 titles.

### 3. Long Term (Future Architecture)
- **Decentralized IPFS Mirror Links**: Optional fallback mirror addresses for public domain literature archived on IPFS.
- **Automated ISBN Resolution**: Background worker resolving ambiguous ISBN-10 to canonical ISBN-13 with Library of Congress catalog data.
- **Reader Integration**: Deep link discovered EPUB and PDF books directly into an in-browser WebAssembly reader (e.g., Readest / EPUB.js sandbox).
