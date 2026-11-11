---
name: 86k-lookup-link-directory
description: Audit and safely integrate the 86,260-row eBook lookup-link directory. Use when importing book discovery, cover-search, author-research, publisher-search, pricing-search, or legal-access lookup URLs.
---

# 86k lookup-link directory

## Source

The supplied archive contains one CSV with 86,260 manifest rows and these fields:
- Manifest ID
- Listed title
- Listed author / contributor (unverified)
- Listed category
- Source filename
- Google Books and Open Library lookups
- Crossref metadata lookup
- Google Images and Wikimedia Commons cover searches
- Google/Wikipedia author research
- Internet Archive and Project Gutenberg discovery
- Amazon India and Google Play Books purchase searches
- Publisher / official-source search
- Link status

Every supplied row currently says `LOOKUP LINKS CREATED — NOT YET VERIFIED`.

## Rules

- Treat every URL as a research/search link, never as a verified record or direct image.
- Google Images and Wikimedia links are search pages, not cover-image file URLs.
- A free-to-view or free-to-download result is not automatically licensed for redistribution or commercial use.
- Never set a cover to a search-results URL.
- Never infer ISBN, author identity, publisher, edition, original price, market price, page count, or rights status from an unverified query.
- Preserve Manifest IDs and source filenames when a mapping is available.
- Do not delete on title-only similarity; editions, parts, language versions, and different files may be legitimate.
- Keep uncertain matches in manual review.
- Use rate limits, caching, retries with backoff, and provider isolation for API lookups.
- Never scrape retailer HTML for covers or bypass DRM/access controls.

## Audit

Run the standard-library audit script from the repository root:

```bash
python scripts/audit_86k_lookup_directory.py "path/to/ebook_all_86260_link_directory.zip"
```

The script validates headers, row/ID integrity, URL scheme and expected hosts, duplicate title/author/category groups, and link-status labels. It writes a JSON report and does not modify catalog data.

## UI

Use `lib/research-links.ts` to generate missing discovery URLs from a book's current title and author. Prefer saved `book.researchLinks` values when present, then fill missing fields from the helper. Label all such links as unverified search links.
