# SCHEMA_IMPLEMENTATION.md — Schema.org Structured Data Specifications
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Standard:** Schema.org, Google Search Central Rich Results  

---

## 1. Implemented Schema Architecture

### A. Global Schemas (`app/layout.tsx`)
Injected on every page via root layout:
1. **Organization Schema:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "AnonTrove",
     "url": "https://ebook-sandy-chi.vercel.app",
     "logo": "https://ebook-sandy-chi.vercel.app/logo.png",
     "description": "Independent digital bookstore and publishing platform for verified technical manuals, software engineering handbooks, and educational guides.",
     "sameAs": ["https://github.com/tarikk786786/Ebook"]
   }
   ```
2. **WebSite & Sitelinks Searchbox Schema:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "WebSite",
     "name": "AnonTrove",
     "url": "https://ebook-sandy-chi.vercel.app",
     "potentialAction": {
       "@type": "SearchAction",
       "target": "https://ebook-sandy-chi.vercel.app/?q={search_term_string}",
       "query-input": "required name=search_term_string"
     }
   }
   ```

---

### B. Product & Book Schemas (`app/book/[slug]/page.tsx`)
Injected on individual ebook detail pages:
1. **Book Schema with Offer:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Book",
     "name": "Startupology",
     "headline": "Your Day One Startup Manual: From Idea to Thriving Business",
     "author": {
       "@type": "Person",
       "name": "Vivek Chadha"
     },
     "publisher": {
       "@type": "Organization",
       "name": "Zebra Learn"
     },
     "bookFormat": "https://schema.org/EBook",
     "numberOfPages": 412,
     "inLanguage": "en",
     "url": "https://ebook-sandy-chi.vercel.app/book/startupology",
     "offers": {
       "@type": "Offer",
       "price": 199.0,
       "priceCurrency": "INR",
       "availability": "https://schema.org/InStock",
       "url": "https://ebook-sandy-chi.vercel.app/book/startupology",
       "seller": {
         "@type": "Organization",
         "name": "AnonTrove"
       }
     }
   }
   ```
2. **BreadcrumbList Schema:**
   Maps the exact navigational hierarchy: `Home > [Category] > [Book Title]`.

---

### C. Category Hub Schemas (`app/category/[slug]/page.tsx`)
1. **CollectionPage Schema:** Identifies the curated aggregate category and number of items.
2. **FAQPage Schema:** Outlines the category-specific Q&A for rich answer snippet eligibility.
3. **Zero Fake Reviews Directives:** Conforms with Google Search guidelines by strictly omitting `aggregateRating` and `reviewCount` unless verified authenticated customer reviews exist.
