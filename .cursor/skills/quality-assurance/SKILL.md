---
name: quality-assurance
description: Run acceptance checks for cover recovery, dedupe, and storefront regression. Use before marking a gate complete.
---

# Quality assurance

## Always

```bash
node tests/master_system_verification.mjs
node tests/security_regression_suite.mjs
```

When UI changes affect build:

```bash
npx next build
```

## Cover / dedupe

- Pilot precision documented
- Sample public covers render (no dark synthetic)
- Suppressed duplicates absent from catalog listings
- Downloads still work for non-suppressed purchases
- Update `docs/IMPLEMENTATION_CHECKLIST.md` with evidence only

## Forbidden

Marking unfinished buttons or mock stats as done.
