# SEO_BASELINE_AUDIT.md — AnonTrove Comprehensive Technical SEO Baseline Audit
**Target Domain:** `https://ebook-sandy-chi.vercel.app/`  
**Brand:** AnonTrove  
**Platform:** Next.js 14.2.35 App Router (Vercel Serverless & Edge Network)  
**Audit Date:** 2026-11-08  
**Audit Scope:** Technical SEO, eCommerce Indexability, Schema.org Data, Inventory Reconcilation, GEO/AEO Readiness  

---

## 1. Executive Summary & Core Diagnosis

AnonTrove is an independent digital bookstore and educational resource platform with an extensive inventory of over **12,192 verified digital titles** (technical manuals, software engineering guides, cybersecurity handbooks, trading frameworks, and academic course materials). 

Prior to this engineering project, the website suffered from critical technical SEO deficiencies that severely limited organic discoverability, crawler efficiency, and AI search attribution:

1. **Inventory Discrepancy & Inconsistent Brand Messaging:**  
   The homepage hero and layout metadata claimed "1,668+ titles", while the live database actually contained 12,192 published books spanning 508 pages (previously 9,140 books over 381 pages). This damaged user trust and created conflicting signals for search crawlers.
2. **Complete Absence of XML Sitemaps:**  
   Neither `sitemap.xml` nor dynamic Next.js `sitemap.ts` existed. Crawlers had to rely exclusively on client-rendered pagination buttons, leaving thousands of deep catalog URLs undiscovered.
3. **Missing `robots.txt` Directives:**  
   No `robots.txt` existed to guide crawlers. Bots spent crawl budget exploring private token routes (`/api/reader/*`, `/reader/*`), internal admin panels (`/admin/*`), and rate-limited endpoints.
4. **Mismatched Metadata Base URL:**  
   `app/layout.tsx` hardcoded `metadataBase: new URL('https://tb.is-a.dev')` instead of the canonical production domain (`https://ebook-sandy-chi.vercel.app`), causing broken Open Graph previews, distorted canonical tags, and split domain authority.
5. **No-Referrer Policy Suppressing Analytics:**  
   `<meta name="referrer" content="no-referrer" />` was declared in root `<head>`, actively stripping referrer headers and blinding Google Search Console and Google Analytics to inbound traffic attribution.
6. **Missing Schema.org Structured Data:**  
   Product detail pages lacked Schema.org `Book`, `Product`, `Offer`, and `BreadcrumbList` JSON-LD. The homepage lacked `Organization` and `WebSite` structured data.
7. **Fragmented Category Structure:**  
   The catalog was split into 20 loosely defined, overlapping categories without dedicated, crawlable category landing pages (`/category/[slug]`).
8. **Absence of Generative Engine Optimization (GEO/AEO):**  
   No `llms.txt`, entity graph, or answer-engine FAQ infrastructure existed for discovery by ChatGPT Search, Perplexity, Gemini, or Claude.

---

## 2. Technical SEO Baseline Findings Matrix

| Audit Area | Baseline Observation | Impact Severity | Required Action | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Domain & Base URL** | `metadataBase` pointed to `https://tb.is-a.dev` | **CRITICAL** | Change to canonical `https://ebook-sandy-chi.vercel.app` | **REMEDIATED** |
| **Inventory Count** | Hero claimed 1,668+; catalog contained 12,192 items | **HIGH** | Reconcile dynamically to `BOOK_CATALOG.length` | **REMEDIATED** |
| **XML Sitemaps** | 0 sitemaps existed; 12,000+ deep URLs orphaned | **CRITICAL** | Implement dynamic Next.js sitemap index + sub-sitemaps | **REMEDIATED** |
| **Robots Directives** | No `robots.txt`; private reader routes exposed to crawl | **HIGH** | Implement `app/robots.ts` blocking `/api/`, `/admin/`, `/reader/` | **REMEDIATED** |
| **Meta Referrer** | `no-referrer` stripped analytics attribution | **HIGH** | Replace with `strict-origin-when-cross-origin` | **REMEDIATED** |
| **Product Canonicals** | Missing `alternates.canonical` on `/book/[slug]` | **HIGH** | Add self-referencing absolute canonical URLs | **REMEDIATED** |
| **Structured Data** | 0 JSON-LD tags on product detail pages | **HIGH** | Inject valid `Book`, `Product`, `Offer` & `BreadcrumbList` | **REMEDIATED** |
| **Category Architecture**| 20 overlapping categories; no dedicated landing pages | **MEDIUM** | Map to 10 authoritative topical clusters with SSR pages | **REMEDIATED** |
| **GEO / AEO** | No machine-readable manifest or entity citations | **MEDIUM** | Deploy `/llms.txt`, `/llms-full.txt` and AEO FAQ schemas | **REMEDIATED** |
| **Pagination Crawlability**| Infinite JavaScript pagination with no direct hrefs | **MEDIUM** | Render static internal linking paths and hub pages | **REMEDIATED** |

---

## 3. Product & Inventory Reconciliation Details

- **Database Registry Files:**
  - `data/books_registry.json`: 12,192 raw records
  - `data/demanded_books_registry.json`: 261 curated high-demand titles
- **Authoritative Published Inventory:** Exactly **12,192 unique books**.
- **Pagination Mathematics:** 12,192 titles @ 24 items per page = **508 total catalog pages**.
- **Reconciliation Fix:**
  - Removed all hardcoded instances of "1,668+" from `app/layout.tsx`, `app/page.tsx`, and `components/CartDrawer.tsx`.
  - Replaced with dynamic count from `BOOK_CATALOG.length.toLocaleString()` ("12,192+ verified titles").

---

## 4. Crawl Path & Indexation Strategy

### Public Indexable Scope (Targeted for Sitemaps & Search Engines)
- Homepage: `https://ebook-sandy-chi.vercel.app/`
- Category Landing Hubs: `https://ebook-sandy-chi.vercel.app/category/[slug]`
- Individual Ebook Detail Pages: `https://ebook-sandy-chi.vercel.app/book/[slug]`
- Digital Reading Tools: `https://ebook-sandy-chi.vercel.app/tools` and `/tools/[slug]`
- Informational & Trust Pages: `/about`, `/mission`, `/copyright`, `/service-fee`

### Strictly Non-Indexable Scope (Blocked via Robots & Noindex)
- In-Browser Reader Session: `/reader/[token]` (`noindex, nofollow`)
- File Download Delivery: `/api/download/[token]` (`noindex, nofollow`)
- Internal API Endpoints: `/api/*`
- Administrative Dashboard: `/admin/*`
- Checkout & Order Confirmation: `/checkout`, `/success`
