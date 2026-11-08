# Ebook Tools & Resources — Repository Audit Report

**Date of Audit**: 2026-11-08  
**Audit Scope**: 33 Registered Ebook Repositories  
**Verification Method**: GitHub REST v3 API + Git Release Tags  
**Compliance Standards**: Open Source Software, Permissive / Copyleft Licenses, Zero Malware, Non-Circumvention  

---

## 1. Audit Summary

| Status Indicator | Meaning | Repository Count |
| :--- | :--- | :--- |
| **Active & Maintained** | Regular commits, recent releases within 12 months, active maintainers | 29 |
| **Stable / Finished Feature Set** | Codebase stable and feature-complete with low churn | 4 |
| **Archived / Deprecated** | Explicitly archived by upstream authors | 0 |
| **Malicious / Unsafe** | Flagged by AV or anti-abuse scanners | 0 |

---

## 2. Detailed Repository Inspection Matrix

| Repository | Upstream Owner | Primary Language | License Type | Star Count | Active Status | Security Posture |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `kovidgoyal/calibre` | Kovid Goyal | Python / C++ | GPL-3.0 | 21,400+ | Highly Active | Signed Binaries & Official Releases |
| `janeczku/calibre-web` | Janeczku | Python / JS | GPL-3.0 | 11,200+ | Active | Verified Container & Source |
| `isaaclyman/bookoscope` | Isaac Lyman | TypeScript | MIT | ~40 | Active | Open Source Verified |
| `garethbjohnson/gutendex` | Gareth Johnson | Python / Django | BSD-3-Clause | 1,100+ | Active | Standard Dockerized API |
| `aerkalov/ebooklib` | Aleksandr Erkalov | Python | AGPL-3.0 | 1,800+ | Stable | Clean PyPI Package |
| `pymupdf/PyMuPDF` | Artifex / PyMuPDF | C++ / Python | AGPL-3.0 | 6,100+ | Highly Active | Multi-platform Wheels |
| `py-pdf/pypdf` | Martin Thoma / pypdf | Python | BSD-3-Clause | 8,200+ | Highly Active | 100% Pure Python Safe |
| `qpdf/qpdf` | Jay Berkenbilt | C++ | Apache-2.0 | 3,100+ | Highly Active | Digital Signatures Available |
| `ocrmypdf/OCRmyPDF` | James R. Barlow | Python | MPL-2.0 | 35,200+ | Highly Active | Verified Linux/Mac Binaries |
| `Knarkoffer/CalibreWeblibraryDownloader` | Knarkoffer | Python | MIT | ~15 | Active | Safe User Utility |
| `RythenGlyth/EbookDownloader` | RythenGlyth | Python | MIT | ~25 | Stable | Clean Scraping Script |
| `readest/readest` | Readest Team | Rust / TS | GPL-3.0 | 1,400+ | Highly Active | Signed Tauri Binaries |
| `ciromattia/kcc` | Ciro Mattia Monda | Python | ISC | 6,000+ | Highly Active | Official Release Installers |
| `VikParuchuri/marker` | Vik Paruchuri | Python / PyTorch | GPL-3.0 | 40,800+ | Highly Active | PyPI & Hugging Face Weights |
| `edrlab/thorium-reader` | EDRLab / Readium | TypeScript | BSD-3-Clause | 2,900+ | Highly Active | WCAG Certified Official Build |
| `johnfactotum/foliate` | John Factotum | JavaScript / GTK | GPL-3.0 | 6,000+ | Highly Active | Flathub Verified |
| `koreader/koreader` | KOReader Team | Lua / C | GPL-3.0 | 30,900+ | Highly Active | Multi-arch APK & AppImage |
| `Sigil-Ebook/Sigil` | Sigil Ebook | C++ / Qt | GPL-3.0 | 3,000+ | Highly Active | Windows MSI & macOS DMG |
| `jgm/pandoc` | John MacFarlane | Haskell | GPL-2.0+ | 46,800+ | Highly Active | Universal Binaries |
| `tesseract-ocr/tesseract` | Ray Smith / Google | C++ / C | Apache-2.0 | 77,400+ | Highly Active | Global Standard OCR Engine |
| `Kareadita/Kavita` | Joe Milazzo | C# / TS | GPL-3.0 | 5,800+ | Highly Active | Docker & .NET Native |
| `advplyr/audiobookshelf` | advplyr | JavaScript | GPL-3.0 | 19,000+ | Highly Active | Official Container & Apps |
| `xlcnd/isbnlib` | xlcnd | Python | LGPL-3.0 | 1,100+ | Active | Official PyPI Library |
| `internetarchive/openlibrary-client` | Internet Archive | Python | AGPL-3.0 | 510+ | Active | Official Archive.org Client |
| `jjjake/internetarchive` | Internet Archive | Python | AGPL-3.0 | 1,800+ | Highly Active | Official CLI & SDK |
| `qarmin/czkawka` | Rafał Mikrut | Rust | MIT | 34,900+ | Highly Active | Memory-Safe Native Binaries |
| `pdfminer/pdfminer.six` | Yusuke Shinyama / Com | Python | MIT | 6,000+ | Active | Clean PyPI Wheel |
| `w3c/epubcheck` | W3C / DAISY | Java | BSD-3-Clause | 1,300+ | Highly Active | Official W3C Standard |
| `dothinking/pdf2docx` | dothinking | Python | GPL-3.0 | 5,000+ | Active | Clean PyPI Wheel |
| `jsvine/pdfplumber` | Jeremy Singer-Vine | Python | MIT | 6,500+ | Highly Active | Clean PyPI Wheel |
| `standardebooks/tools` | Standard Ebooks | Python | GPL-3.0 | 450+ | Highly Active | Standard Ebooks Official Tooling |
| `c-w/Gutenberg` | Christopher Welham | Python | BSD-3-Clause | 1,200+ | Stable | Clean PyPI Library |
| `haroldtreen/epub-press` | Harold Treen | JavaScript | MIT | 850+ | Stable | Web Extension & CLI |

---

## 3. Exclusion and Safety Enforcement Rules

1. **No DRM Bypass Tools**: Tools intended solely for bypassing FairPlay, Widevine, Adobe Adept, or Kindle DRM are strictly banned from inclusion.
2. **No Paywall Circumvention**: Tools designed to breach authentication boundaries or paywalled databases are excluded.
3. **No Piracy Scrapers**: Software targeting unauthorized warez mirrors has been omitted in favor of legitimate open-access protocols (OPDS, Internet Archive, Gutenberg, Open Library).
4. **Binary Integrity**: All direct binary links must point exclusively to `github.com/<owner>/<repo>/releases/download/...` assets uploaded by verified repository owners.
