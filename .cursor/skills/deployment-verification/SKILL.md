---
name: deployment-verification
description: Verify production readiness for cover/API changes without pushing bulk binaries. Use before Vercel deploy or when confirming live cover behavior.
---

# Deployment verification

## Rules

- Do not commit tens of thousands of JPEG covers — use index + selective sync.
- Confirm env on Vercel: site URL, FamGateway, download secret, admin/cron, optional `GOOGLE_BOOKS_API_KEY`.
- Smoke: `https://ebook-sandy-chi.vercel.app` book cards + `/api/covers/{slug}?v=`
- After deploy: spot-check Startupology and 5 random catalog_nums
- Never push `.env.local` or session files

## Evidence

HTTP 200 on primary domain; cover API returns image or intentional light fallback — not dark synthetic.
