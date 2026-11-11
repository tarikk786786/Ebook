# 86,260-row eBook lookup-link directory

## What the uploaded archive contains

The archive contains a CSV of 86,260 rows (Manifest IDs 1–86,260). It stores title/author/category/filename metadata and discovery URLs for Google Books, Open Library, Crossref, Google Images, Wikimedia Commons, author research, Internet Archive, Project Gutenberg, Amazon India, Google Play Books, and publisher searches.

The current source status on all 86,260 rows is `LOOKUP LINKS CREATED — NOT YET VERIFIED`.

These URLs are lookup/search pages. The Google Images and Wikimedia entries are not direct cover image URLs. They do not verify that a result is the same edition, that a cover is authentic, that a download is lawful, or that commercial redistribution is permitted.

## Audit the uploaded archive

The raw CSV is about 171 MB, so it is intentionally not committed as a GitHub source file. The repository already ignores the extracted file `data/ebook_all_86260_link_directory.csv`.

Run:

```bash
python scripts/audit_86k_lookup_directory.py "C:/path/to/ebook_all_86260_link_directory.zip"
```

You can also pass the extracted CSV directly. The audit writes `data/reports/research_link_directory_audit.json` and never changes the catalog.

## Storefront behavior

Book detail pages build per-book discovery URLs from the current title and author when saved research links are missing. The links are grouped by purpose (bibliographic metadata, cover discovery, author research, legitimate access discovery, retailer comparison, and publisher source search).

All links are labelled as unverified search leads. A human reviewer must confirm the matching edition and check the exact image/source license before updating a cover or offering a downloadable file.

## Cover handling

Only a real image URL or a locally stored image that has passed the project's cover-matching and image-quality checks can populate a cover field. Never store Google Images/Wikimedia search-result URLs as `coverImage`. Keep cover provenance, attribution, and license evidence alongside approved cover assets.
