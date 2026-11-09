# INTERNAL_LINKING_STRATEGY.md — Crawl Optimization & Link Architecture
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Objective:** Eliminate orphan pages, maximize PageRank distribution, and provide deep crawl paths across 12,000+ digital products.

---

## 1. Hub-and-Spoke Topical Architecture

AnonTrove organizes its 12,192 titles through a structured **Hub-and-Spoke** linking model:
1. **The Root Hub (Homepage):**
   - Links to all 10 Authoritative Category Landing Hubs (`/category/[slug]`).
   - Links to curated Bestseller spotlights (e.g. Android Hacker's Handbook, Startupology, Master Bundle).
   - Links to Digital Reading Tools (`/tools`).
2. **Category Hubs (Thematic Pillars):**
   - Links directly to top 48 titles in that discipline.
   - Provides contextual filter links back to main store (`/?category=...`).
   - Cross-links to 4 adjacent categories to pass equity across related domains.
3. **Product Spokes (Individual Titles):**
   - Breadcrumb navigation linking back to Home and the parent Category Hub.
   - Related Books Carousel: Every product links to 4 topical peers in the same category or matching tags.
   - Author links (where multiple books by same author exist).

---

## 2. Crawl Efficiency & Orphan Prevention

- **Sitemap Index:** Bridges discovery for long-tail titles not immediately linked on the homepage.
- **Tools Directory Cross-Linking:** The reading tools hub (`/tools`) links back to relevant instructional ebooks on EPUB/PDF reading and OCR processing.
- **Anchor Text Guidelines:**
  - Avoid generic "click here" or "read more" links.
  - Use descriptive, title-based and category-based anchors (e.g. "Explore Programming & Software Engineering eBooks").
