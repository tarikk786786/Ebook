# AnonTrove Vercel Production Deployment Guide

## Production Deployment Checklist
1. **Run Full Test Suite**:
   ```bash
   npm run test:seo
   npm run test:security
   ```
2. **Validate TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
3. **Build Application**:
   ```bash
   npm run build
   ```
4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

## Post-Deployment Verification
- Confirm `/sitemap.xml` returns 200 OK with XML content-type.
- Confirm `/robots.txt` returns 200 OK with User-agent: *.
- Confirm `/llms.txt` returns 200 OK.
- Confirm `/admin/seo` requires `x-admin-token` authentication.
