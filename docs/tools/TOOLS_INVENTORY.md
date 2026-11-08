# Ebook Tools & Resources — Complete Tools Inventory

**Generated**: 2026-11-08  
**Total Registered Tools**: 33  
**Verified Active Repositories**: 33  
**Core Categories**: 14  
**Licensing**: 100% Free and Open Source (FOSS)  
**Release Tracking Source**: Official GitHub Releases & REST API  

---

## 1. Directory Overview by Category

| Category | Primary Tools | Ecosystem Role |
| :--- | :--- | :--- |
| **1. Ebook Scrapers and Discovery** | Gutendex, Gutenberg Text Scraper & Cleaner | Automated retrieval and catalog indexing of public-domain literature |
| **2. Ebook Download Managers** | CalibreWeblibraryDownloader, EbookDownloader | Scripted batch downloading, remote library synchronization |
| **3. Ebook Readers** | Readest, Foliate, KOReader, Thorium Reader, Bookoscope | Multi-platform distraction-free, e-ink, and accessible reading interfaces |
| **4. PDF Tools** | PyMuPDF, pypdf, QPDF, pdfminer.six, pdfplumber | High-speed rasterization, layout analysis, linearization, and text extraction |
| **5. EPUB Tools** | EbookLib, Sigil, EPUBCheck, Standard Ebooks Tools | Structural editing, W3C validation, typography crafting, and EPUB manipulation |
| **6. MOBI and Kindle Tools** | Kindle Comic Converter (KCC), EpubPress | E-ink contrast optimization, panel slicing, web-to-MOBI conversion |
| **7. Ebook Converters** | Pandoc, pdf2docx | Universal document compilation and PDF-to-DOCX layout preservation |
| **8. OCR and Document Extraction** | Tesseract OCR, OCRmyPDF | Neural LSTM character recognition, searchable PDF/A generation |
| **9. Metadata and ISBN Tools** | isbnlib | Checksum validation, hyphenation, and bibliographic lookup across public APIs |
| **10. Cover Discovery** | Open Library Client & Cover Resolver | Artwork and high-resolution cover resolution by ISBN/OCLC |
| **11. Library Management** | Calibre, Calibre-Web, Kavita, Audiobookshelf | End-to-end cataloging, multi-user OPDS servers, metadata scraping |
| **12. Search and Indexing** | Czkawka Duplicate Finder | Multi-threaded Blake3 hashing and duplicate ebook identification |
| **13. Automation and AI Tools** | Marker | Deep learning model converting PDFs to clean Markdown and LaTeX |
| **14. Open-Access Research Tools** | Internet Archive CLI | Programmatic access to millions of public domain texts and MARC records |

---

## 2. Complete Inventory Catalog

### 1. Calibre
- **Slug**: `calibre`
- **Repository**: [kovidgoyal/calibre](https://github.com/kovidgoyal/calibre)
- **Primary Category**: Library Management
- **Stars**: ~21,000+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Windows x64, Windows ARM64, macOS (Intel & Apple Silicon), Linux, Android
- **Supported Formats**: EPUB, PDF, MOBI, AZW3, CBZ, CBR, FB2, TXT, LIT, RTF, ODT, DOCX
- **Install Commands**: `winget install calibre.calibre` | `brew install --cask calibre`
- **Docker Image**: `linuxserver/calibre`

### 2. Calibre-Web
- **Slug**: `calibre-web`
- **Repository**: [janeczku/calibre-web](https://github.com/janeczku/calibre-web)
- **Primary Category**: Library Management
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Linux, Docker, Windows, macOS
- **Supported Formats**: EPUB, PDF, MOBI, AZW3, CBR, CBZ, FB2, TXT
- **Install Commands**: `pip install calibreweb` | `docker run -p 8083:8083 linuxserver/calibre-web`

### 3. Readest
- **Slug**: `readest`
- **Repository**: [readest/readest](https://github.com/readest/readest)
- **Primary Category**: Ebook Readers
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Windows x64, macOS Universal, Linux x86_64, Android
- **Supported Formats**: EPUB, PDF, MOBI, AZW3, TXT
- **Stack**: Rust, Tauri, React

### 4. KOReader
- **Slug**: `koreader`
- **Repository**: [koreader/koreader](https://github.com/koreader/koreader)
- **Primary Category**: Ebook Readers
- **Stars**: ~30,900+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Android, Linux, Kindle, Kobo, PocketBook, macOS, Windows
- **Supported Formats**: PDF, EPUB, MOBI, DJVU, CBZ, FB2, TXT, HTML, RTF, CHM

### 5. Thorium Reader
- **Slug**: `thorium-reader`
- **Repository**: [edrlab/thorium-reader](https://github.com/edrlab/thorium-reader)
- **Primary Category**: Ebook Readers
- **Stars**: ~2,900+
- **License**: BSD 3-Clause
- **Supported Platforms**: Windows x64, macOS, Linux (Flatpak/AppImage)
- **Supported Formats**: EPUB, EPUB3, PDF, DAISY, Audiobooks

### 6. Foliate
- **Slug**: `foliate`
- **Repository**: [johnfactotum/foliate](https://github.com/johnfactotum/foliate)
- **Primary Category**: Ebook Readers
- **Stars**: ~6,000+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Linux (Flatpak, Apt, Arch)
- **Supported Formats**: EPUB, MOBI, AZW, AZW3, FB2, CBZ, PDF

### 7. Bookoscope
- **Slug**: `bookoscope`
- **Repository**: [isaaclyman/bookoscope](https://github.com/isaaclyman/bookoscope)
- **Primary Category**: Ebook Readers
- **License**: MIT License
- **Supported Platforms**: Windows, macOS, Linux, Web
- **Supported Formats**: EPUB, PDF

### 8. PyMuPDF
- **Slug**: `pymupdf`
- **Repository**: [pymupdf/PyMuPDF](https://github.com/pymupdf/PyMuPDF)
- **Primary Category**: PDF Tools
- **Stars**: ~6,000+
- **License**: GNU AGPL v3.0
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: PDF, EPUB, MOBI, XPS, CBZ, FB2, TXT
- **Install Command**: `pip install pymupdf`

### 9. pypdf
- **Slug**: `pypdf`
- **Repository**: [py-pdf/pypdf](https://github.com/py-pdf/pypdf)
- **Primary Category**: PDF Tools
- **Stars**: ~8,000+
- **License**: BSD 3-Clause
- **Supported Platforms**: Cross-Platform Pure Python
- **Supported Formats**: PDF
- **Install Command**: `pip install pypdf`

### 10. QPDF
- **Slug**: `qpdf`
- **Repository**: [qpdf/qpdf](https://github.com/qpdf/qpdf)
- **Primary Category**: PDF Tools
- **Stars**: ~3,000+
- **License**: Apache License 2.0
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: PDF
- **Install Command**: `winget install qpdf.qpdf` | `brew install qpdf`

### 11. pdfminer.six
- **Slug**: `pdfminer-six`
- **Repository**: [pdfminer/pdfminer.six](https://github.com/pdfminer/pdfminer.six)
- **Primary Category**: PDF Tools
- **Stars**: ~6,000+
- **License**: MIT License
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: PDF, HTML, XML, TXT
- **Install Command**: `pip install pdfminer.six`

### 12. pdfplumber
- **Slug**: `pdfplumber`
- **Repository**: [jsvine/pdfplumber](https://github.com/jsvine/pdfplumber)
- **Primary Category**: PDF Tools
- **Stars**: ~6,500+
- **License**: MIT License
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: PDF
- **Install Command**: `pip install pdfplumber`

### 13. Sigil
- **Slug**: `sigil`
- **Repository**: [Sigil-Ebook/Sigil](https://github.com/Sigil-Ebook/Sigil)
- **Primary Category**: EPUB Tools
- **Stars**: ~3,000+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Windows x64, macOS, Linux
- **Supported Formats**: EPUB, EPUB3, HTML, TXT
- **Install Command**: `winget install Sigil.Sigil` | `brew install --cask sigil`

### 14. EbookLib
- **Slug**: `ebooklib`
- **Repository**: [aerkalov/ebooklib](https://github.com/aerkalov/ebooklib)
- **Primary Category**: EPUB Tools
- **Stars**: ~1,800+
- **License**: GNU AGPL v3.0
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: EPUB, EPUB3, MOBI
- **Install Command**: `pip install EbookLib`

### 15. EPUBCheck
- **Slug**: `epubcheck`
- **Repository**: [w3c/epubcheck](https://github.com/w3c/epubcheck)
- **Primary Category**: EPUB Tools
- **Stars**: ~1,300+
- **License**: BSD 3-Clause (W3C / DAISY)
- **Supported Platforms**: Cross-Platform Java (JRE 11+)
- **Supported Formats**: EPUB, EPUB3
- **Install Command**: `brew install epubcheck`

### 16. Standard Ebooks Tools
- **Slug**: `standardebooks-tools`
- **Repository**: [standardebooks/tools](https://github.com/standardebooks/tools)
- **Primary Category**: EPUB Tools
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Linux, macOS, WSL
- **Supported Formats**: EPUB, AZW3, KEPUB
- **Install Command**: `pip install standardebooks`

### 17. Kindle Comic Converter (KCC)
- **Slug**: `kindle-comic-converter`
- **Repository**: [ciromattia/kcc](https://github.com/ciromattia/kcc)
- **Primary Category**: MOBI and Kindle Tools
- **Stars**: ~6,000+
- **License**: ISC License
- **Supported Platforms**: Windows x64, macOS, Linux
- **Supported Formats**: MOBI, EPUB, CBZ, CBR, CB7, PDF
- **Install Command**: `brew install --cask kcc` | `pip install KindleComicConverter`

### 18. EpubPress
- **Slug**: `epub-press`
- **Repository**: [haroldtreen/epub-press](https://github.com/haroldtreen/epub-press)
- **Primary Category**: MOBI and Kindle Tools
- **License**: MIT License
- **Supported Platforms**: Cross-Platform Node.js, Chrome, Firefox
- **Supported Formats**: EPUB, MOBI
- **Install Command**: `npm install -g epub-press-cli`

### 19. Pandoc
- **Slug**: `pandoc`
- **Repository**: [jgm/pandoc](https://github.com/jgm/pandoc)
- **Primary Category**: Ebook Converters
- **Stars**: ~46,800+
- **License**: GNU General Public License v2.0+
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: EPUB, PDF, MOBI, HTML, DOCX, ODT, Markdown, LaTeX
- **Install Command**: `winget install JohnMacFarlane.Pandoc` | `brew install pandoc`
- **Docker Image**: `pandoc/core`

### 20. pdf2docx
- **Slug**: `pdf2docx`
- **Repository**: [dothinking/pdf2docx](https://github.com/dothinking/pdf2docx)
- **Primary Category**: Ebook Converters
- **Stars**: ~5,000+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: PDF, DOCX
- **Install Command**: `pip install pdf2docx`

### 21. Tesseract OCR
- **Slug**: `tesseract`
- **Repository**: [tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract)
- **Primary Category**: OCR and Document Extraction
- **Stars**: ~77,400+
- **License**: Apache License 2.0
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: PDF, PNG, JPEG, TIFF, HOCR, ALTO, TXT
- **Install Command**: `brew install tesseract` | `apt install tesseract-ocr`

### 22. OCRmyPDF
- **Slug**: `ocrmypdf`
- **Repository**: [ocrmypdf/OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF)
- **Primary Category**: OCR and Document Extraction
- **Stars**: ~35,200+
- **License**: Mozilla Public License 2.0
- **Supported Platforms**: Linux, macOS, Windows, Docker
- **Supported Formats**: PDF, PDF/A
- **Install Command**: `brew install ocrmypdf` | `pip install ocrmypdf`
- **Docker Image**: `ocrmypdf/ocrmypdf`

### 23. isbnlib
- **Slug**: `isbnlib`
- **Repository**: [xlcnd/isbnlib](https://github.com/xlcnd/isbnlib)
- **Primary Category**: Metadata and ISBN Tools
- **Stars**: ~1,100+
- **License**: GNU Lesser General Public License v3.0
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: ISBN-10, ISBN-13, JSON, BibTeX
- **Install Command**: `pip install isbnlib`

### 24. Open Library Client & Cover Resolver
- **Slug**: `openlibrary-client`
- **Repository**: [internetarchive/openlibrary-client](https://github.com/internetarchive/openlibrary-client)
- **Primary Category**: Cover Discovery
- **Stars**: ~510+
- **License**: GNU Affero General Public License v3.0
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: JSON, Covers (JPG/PNG), MARC
- **Install Command**: `pip install openlibrary-client`

### 25. Kavita
- **Slug**: `kavita`
- **Repository**: [Kareadita/Kavita](https://github.com/Kareadita/Kavita)
- **Primary Category**: Library Management
- **Stars**: ~5,800+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Windows, macOS, Linux, Docker
- **Supported Formats**: EPUB, PDF, MOBI, CBZ, CBR, ZIP
- **Install Command**: `winget install Kareadita.Kavita`
- **Docker Image**: `jvmilazz0/kavita`

### 26. Audiobookshelf
- **Slug**: `audiobookshelf`
- **Repository**: [advplyr/audiobookshelf](https://github.com/advplyr/audiobookshelf)
- **Primary Category**: Library Management
- **Stars**: ~19,000+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Linux, Docker, Windows, macOS, Android, iOS
- **Supported Formats**: EPUB, PDF, M4B, MP3, FLAC, CBZ
- **Docker Image**: `ghcr.io/advplyr/audiobookshelf:latest`

### 27. Czkawka Duplicate Finder
- **Slug**: `czkawka`
- **Repository**: [qarmin/czkawka](https://github.com/qarmin/czkawka)
- **Primary Category**: Search and Indexing
- **Stars**: ~34,900+
- **License**: MIT License
- **Supported Platforms**: Windows x64, Linux, macOS
- **Supported Formats**: PDF, EPUB, MOBI, All Files
- **Install Command**: `winget install qarmin.czkawka` | `brew install czkawka`

### 28. Marker
- **Slug**: `marker`
- **Repository**: [VikParuchuri/marker](https://github.com/VikParuchuri/marker)
- **Primary Category**: Automation and AI Tools
- **Stars**: ~40,800+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Linux, Windows, macOS
- **Supported Formats**: PDF, EPUB, MOBI, Markdown, JSON
- **Install Command**: `pip install marker-pdf`

### 29. Internet Archive CLI
- **Slug**: `internetarchive`
- **Repository**: [jjjake/internetarchive](https://github.com/jjjake/internetarchive)
- **Primary Category**: Open-Access Research Tools
- **Stars**: ~1,800+
- **License**: GNU General Public License v3.0
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: EPUB, PDF, DJVU, TXT, MOBI, MARC
- **Install Command**: `pip install internetarchive`

### 30. Gutendex
- **Slug**: `gutendex`
- **Repository**: [garethbjohnson/gutendex](https://github.com/garethbjohnson/gutendex)
- **Primary Category**: Ebook Scrapers and Discovery
- **License**: BSD 3-Clause
- **Supported Platforms**: Linux, Docker, macOS, Windows
- **Supported Formats**: EPUB, PDF, MOBI, TXT, HTML
- **Docker Image**: `garethbjohnson/gutendex`

### 31. Gutenberg Text Scraper & Cleaner
- **Slug**: `gutenberg-python`
- **Repository**: [c-w/Gutenberg](https://github.com/c-w/Gutenberg)
- **Primary Category**: Ebook Scrapers and Discovery
- **Stars**: ~1,200+
- **License**: BSD 3-Clause
- **Supported Platforms**: Cross-Platform Python
- **Supported Formats**: TXT, RDF
- **Install Command**: `pip install Gutenberg`

### 32. CalibreWeblibraryDownloader
- **Slug**: `calibre-web-library-downloader`
- **Repository**: [Knarkoffer/CalibreWeblibraryDownloader](https://github.com/Knarkoffer/CalibreWeblibraryDownloader)
- **Primary Category**: Ebook Download Managers
- **License**: MIT License
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: EPUB, PDF, MOBI, AZW3, CBR, CBZ

### 33. EbookDownloader
- **Slug**: `ebook-downloader`
- **Repository**: [RythenGlyth/EbookDownloader](https://github.com/RythenGlyth/EbookDownloader)
- **Primary Category**: Ebook Download Managers
- **License**: MIT License
- **Supported Platforms**: Windows, macOS, Linux
- **Supported Formats**: EPUB, MOBI, TXT, PDF
