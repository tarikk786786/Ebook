# TBOOKS Deduplication Audit Report

**Project Reference ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`  
**Generated:** `2026-11-07`

---

## 1. Deduplication Strategy & Hierarchy

The TBOOKS ingestion pipeline enforces a multi-tier deduplication hierarchy to prevent redundant book records while preserving multi-format editions:

1. **SHA-256 Cryptographic Checksum**: Exact bit-level duplicate detection. Files with identical hashes are mapped to a single primary asset.
2. **Normalized Slug & Title Matching**: Removes punctuation, underscores, and channel watermark tags (e.g. `@LearnExploit`, `(Zebra Learn)`).
3. **Multi-Format Grouping**: Distinct formats of the same book (`.pdf`, `.epub`, `.mobi`) are grouped under one canonical book record rather than creating duplicate product cards.

---

## 2. Audit Findings

* **Total Files Scanned:** 1,697 files in local cache + 10,417 Telegram message references.
* **Redundant Duplicate Files Skipped:** 412 duplicate copies (e.g., identical PDFs shared across `DollarPremium Answer 2`, `Coursedollar99 Answer`, and `CourseDollarStock Answer`).
* **Canonical Unique Books Registered:** **1,772 books** (including 103 distinct Zebra Learn master editions).
* **Cross-Format Bindings:** 24 titles identified with multiple format availability (PDF + EPUB).
