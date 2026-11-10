---
name: cover-matching
description: Score and rank cover candidates against ebook records using ISBN, title, author, edition. Use before auto-assigning or presenting review candidates.
---

# Cover matching

## Priority

1. Exact ISBN-13 / ISBN-10
2. Exact edition id
3. Exact title + author
4. Title + author + publisher/year
5. Fuzzy only with admin review

## Weights (initial)

ISBN 50 · Exact title 20 · Author 15 · Edition/volume 10 · Publisher/year 5

## Thresholds

- 95–100: auto HIGH if no hard conflict
- 80–94: admin review
- &lt;80: do not auto-assign

## Code

`lib/cover-recovery/matcher.ts`

Never confirm book identity from image similarity alone. Preserve original metadata separately from normalized forms.
