# SEO_DEPLOYMENT_CHECKLIST.md — Pre-Deployment & Production SEO Verification
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  

---

## Pre-Deployment Verification Checklist

Before pushing code changes to production or deploying preview builds, verify each gate:

### 1. Build & Type Safety
- [x] TypeScript compiler passes with zero errors (`npx tsc --noEmit`).
- [x] Next.js production build succeeds (`npm run build`).
- [x] All 307+ static and dynamic pages compile successfully.

### 2. Crawl & Indexing Infrastructure
- [x] `app/robots.ts` allows public routes and disallows `/api/`, `/admin/`, `/reader/`.
- [x] `app/sitemap.ts` generates valid sitemap entries with priority and changeFrequency.
- [x] Zero private download or reader token URLs exist in sitemaps.
- [x] `public/llms.txt` and `public/llms-full.txt` are accessible.

### 3. Canonical URLs & Metadata
- [x] `metadataBase` in `app/layout.tsx` matches `https://ebook-sandy-chi.vercel.app`.
- [x] All product detail pages (`/book/[slug]`) include self-referencing absolute canonicals.
- [x] All category pages (`/category/[slug]`) include self-referencing absolute canonicals.
- [x] `<meta name="referrer" content="strict-origin-when-cross-origin" />` is present.
- [x] Open Graph images and Twitter summary cards resolve to valid image URLs.

### 4. Structured Data (Schema.org)
- [x] `Organization` schema present on root layout.
- [x] `WebSite` schema with SearchAction present on root layout.
- [x] `Book` schema with `Offer` (INR currency, InStock) present on book detail pages.
- [x] `BreadcrumbList` schema present on book detail pages.
- [x] `CollectionPage` and `FAQPage` schemas present on category pages.
- [x] Zero fake reviews, simulated stars, or fictitious aggregate ratings.

### 5. Inventory & Brand Consistency
- [x] Reconciled inventory count: "12,192+ verified titles" rendered accurately across layout, hero, and cart drawer.
- [x] Authentic author and publisher attribution preserved.

### 6. Automated Script Execution
- [x] `node scripts/seo_audit.mjs` passes all 15 checks.
- [x] `node scripts/validate_sitemap.mjs` passes all 7 checks.
- [x] `node scripts/validate_schema.mjs` passes all 9 checks.
- [x] `node scripts/check_canonicals.mjs` passes all 3 checks.
- [x] `npm run test:security` passes all 7 regression tests.
