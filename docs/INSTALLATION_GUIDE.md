# AnonTrove SEO & Multi-Agent Installation Guide

## Prerequisites
- Node.js >= 18.17.0 (Node 20+ or 24+ recommended)
- npm >= 9.0.0
- Optional: Python 3.10+ (for Crawl4AI, BERTopic, and advertools)

## Step-by-Step Installation

### 1. Clone & Enter Repository
```bash
cd projects/anon-trove-ebooks
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Verify Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `ADMIN_ACCESS_SECRET` is set to at least 16 random characters.

### 4. Run Automated SEO Verification Tests
```bash
npm run test:seo
```
Expected result: 15/15 checks pass with 0 errors.

### 5. Build Production Application
```bash
npm run build
```
Compiles 319+ static and dynamic routes including `/sitemap.xml`, `/robots.txt`, `/category/[slug]`, and `/admin/seo`.
