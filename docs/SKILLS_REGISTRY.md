# AnonTrove Standardized Agent Skills Registry

AnonTrove defines 22 standardized agent skills located in `/skills/<skill-id>`. Each skill implements a complete 5-component lifecycle:
1. `SKILL.md`: Standardized metadata frontmatter and operational rules.
2. `scripts/run.mjs`: Production executable script.
3. `references/checklist.md`: Verification criteria and audit checklist.
4. `examples/output.json`: Structured sample output payload.
5. `tests/test.mjs`: Automated unit test verifying behavior.

## Skills Directory Overview
- `technical-seo`: Complete technical crawl, robots.txt, and sitemap validation.
- `keyword-research`: Commercial search intent mining for ebook digital products.
- `keyword-clustering`: Clustering search queries into 10 authoritative topic pillars.
- `competitor-analysis`: Ethical competitor structure and market pricing benchmarking.
- `content-optimization`: On-page title, description, and reading experience tuning.
- `product-seo`: Individual book detail page optimization (12,192+ titles).
- `category-seo`: Category landing hub optimization with FAQ Schema.
- `schema-validation`: Structured data validation for Google Rich Results.
- `sitemap-validation`: Dynamic Next.js sitemap verification.
- `internal-linking`: Site architecture and internal link graph connectivity.
- `backlink-analysis`: External citation and referring domain monitoring.
- `geo-optimization`: Generative Engine Optimization for ChatGPT, Perplexity, Claude.
- `aeo-optimization`: Answer Engine Optimization for direct question answering.
- `ecommerce-seo`: Commercial catalog and payment flow search alignment.
- `local-seo`: Regional currency (INR) and UPI payment rail optimization.
- `wordpress-seo`: Headless CMS integration compatibility.
- `shopify-seo`: Multi-platform ecommerce catalog sync standards.
- `analytics`: Cookie-free, privacy-preserving visitor analytics tracking.
- `search-console`: Google Search Console indexing and click performance sync.
- `content-quality`: Anti-hallucination, anti-fake reviews verification gate.
- `performance-optimization`: Core Web Vitals (LCP, CLS, INP) monitoring.
- `seo-reporting`: Automated executive reporting and performance summaries.

All 22 skills pass their test suites via `npm run test:seo` or `node scripts/test_all_skills.mjs`.
