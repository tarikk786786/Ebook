# SEO_AUTOMATION.md — Continuous SEO Automation & Monitoring Workflows
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Automation Engine:** Node.js, GitHub Actions & n8n Scheduled Triggers  

---

## 1. Automation Execution Schedule

### A. Daily Health Check (`workflows/daily_seo_health.json`)
- **Trigger:** Daily at 06:00 UTC (11:30 AM IST).
- **Automated Tasks:**
  1. HTTP 200 availability verification on homepage, category hubs, and tools pages.
  2. Verification that `sitemap.xml` and `robots.txt` respond with valid XML/text payloads.
  3. Execution of `node scripts/seo_audit.mjs` to ensure zero regression in metadata or schemas.
  4. Alert notification if broken links or failed status codes are detected.

### B. Weekly Ranking & Sitemap Refresh (`workflows/weekly_ranking_audit.json`)
- **Trigger:** Every Sunday at 00:00 UTC.
- **Automated Tasks:**
  1. Validate canonical URLs with `node scripts/check_canonicals.mjs`.
  2. Verify Schema.org rich snippets with `node scripts/validate_schema.mjs`.
  3. Query Google Search Console API for impressions, clicks, average position, and top landing pages.
  4. Identify any 404 crawl errors reported in GSC.

### C. Monthly Content & Competitor Gap Review (`workflows/monthly_content_review.json`)
- **Trigger:** 1st day of every month.
- **Automated Tasks:**
  1. Re-cluster keywords across new inventory with `node scripts/keyword_clustering.mjs`.
  2. Analyze internal linking density with `node scripts/internal_link_analysis.mjs`.
  3. Sample generative search citations across ChatGPT Search, Perplexity, and Gemini.
