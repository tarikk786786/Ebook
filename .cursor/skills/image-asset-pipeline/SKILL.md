---
name: image-asset-pipeline
description: Validate, optimize, and store ebook cover images using Sharp and existing public/covers conventions. Use when installing covers or fixing broken/dark placeholders.
---

# Image asset pipeline

## Validation

HTTP status, magic bytes, MIME, dimensions, aspect, blank/dark synthetic detection, size limits, rights status.

## Storage (existing)

```
public/covers/{catalog_num}.jpg
```

Optional later: `{ebook_id}/original|catalog|thumbnail` WebP — only after confirming API consumers.

## Rules

- Stable IDs (catalog_num), never titles, for asset keys.
- Record SHA-256 + optional perceptual hash.
- Never upscale tiny images.
- Never overwrite approved/manual covers.
- Reject dark-synthetic placeholders in `/api/covers`.
- Prefer remote URL in index when rights forbid copying.
