# TECHNICAL_SEO_IMPLEMENTATION.md — AnonTrove Technical SEO Architecture
**Platform:** Next.js 14.2.35 App Router (Vercel Serverless Edge)  
**Production URL:** `https://ebook-sandy-chi.vercel.app/`  
**Standard Compliance:** Google Search Essentials, Core Web Vitals, Schema.org  

---

## 1. Domain Canonicalization & MetadataBase

In `app/layout.tsx`, `metadataBase` is set to the authoritative production domain:
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AnonTrove | Premium Independent Ebook & Technical Knowledge Platform',
    template: '%s | AnonTrove',
  },
  alternates: {
    canonical: siteUrl,
  },
  ...
};
```
This guarantees:
- All generated Open Graph image URLs resolve to absolute HTTPS addresses.
- All dynamic routes generate self-referencing absolute canonical tags matching `https://ebook-sandy-chi.vercel.app`.
- Cross-domain splitting (e.g. `tb.is-a.dev`) is eliminated.

---

## 2. Dynamic XML Sitemap Generation (`app/sitemap.ts`)

Next.js App Router dynamically serves `/sitemap.xml` directly from code without static file generation overhead:
- **Scope Included:**
  - Homepage (`/`) — Priority: 1.0, Daily
  - Curated Category Landing Hubs (`/category/[slug]`) — Priority: 0.9, Daily
  - Digital Reading & Extraction Tools (`/tools/[slug]`) — Priority: 0.7, Weekly
  - High-Demand Verified Ebooks (`/book/[slug]`) — Priority: 0.8, Weekly
  - Trust & Compliance Pages (`/about`, `/mission`, `/copyright`, `/service-fee`) — Priority: 0.5, Monthly
- **Scope Excluded (Zero Indexation Risk):**
  - Session Reader: `/reader/[token]`
  - Download Delivery: `/api/download/[token]`
  - Internal APIs: `/api/*`
  - Administration: `/admin/*`
  - Order Processing: `/orders`, `/success`

---

## 3. Robots Exclusion Protocol (`app/robots.ts`)

Serves `/robots.txt` with least-privilege crawl directives:
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/book/', '/books/', '/category/', '/tools/', '/about', '/mission', '/copyright', '/service-fee', '/_next/static/', '/covers/'],
        disallow: ['/api/', '/admin/', '/reader/', '/success', '/orders', '/*?*couponCode=', '/*?*token='],
      },
    ],
    sitemap: 'https://ebook-sandy-chi.vercel.app/sitemap.xml',
  };
}
```

---

## 4. Referrer Policy & Analytics Attribution

The legacy `<meta name="referrer" content="no-referrer" />` tag has been replaced with:
```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
```
This preserves secure cross-origin referral attribution in Google Search Console, Google Analytics 4, and privacy-conscious analytics tools without leaking private token paths.
