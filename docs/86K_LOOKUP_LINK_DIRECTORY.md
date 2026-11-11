# 86,260-row eBook lookup-link directory

## What the uploaded archive contains

The archive contains a CSV of 86,260 rows (Manifest IDs 1–86,260). It stores title/author/category/filename metadata and discovery URLs for Google Books, Open Library, Crossref, Google Images, Wikimedia Commons, author research, Internet Archive, Project Gutenberg, Amazon India, Google Play Books, and publisher searches.

The current source status on all 86,260 rows is `LOOKUP LINKS CREATED — NOT YET VERIFIED`.

These URLs are lookup/search pages. The Google Images and Wikimedia entries are not direct cover image URLs. They do not verify that a result is the same edition, that a cover is authentic, that a download is lawful, or that commercial redistribution is permitted.

## Build the compact directory

The raw CSV is about 171 MB, so it is intentionally not committed as a GitHub source file. Build a compact gzip JSON index from the supplied ZIP or extracted CSV:

```bash
python scripts/build_86k_research_directory.py "C:/path/to/ebook_all_86260_link_directory.zip"
```

The script writes:

- `data/catalog/research_link_directory.json.gz` — compact manifest-ID keyed metadata index.
- `data/reports/research_link_directory_build.json` — row counts, ID integrity and repeated-title group summary.

The generated index stores the manifest ID, original listed title, unverified listed author, category, source filename and unverified status. It does not duplicate the CSV's generated search URLs; the app builds safe HTTPS search URLs from the matched title/author.

Before deploying, add the generated `data/catalog/research_link_directory.json.gz` to the project repository so the Next.js server can read it. Do not commit the raw 171 MB CSV.

## Audit the uploaded archive

To audit the original archive without building the compact index:

```bash
python scripts/audit_86k_lookup_directory.py "C:/path/to/ebook_all_86260_link_directory.zip"
```

You can also pass the extracted CSV directly. The audit writes `data/reports/research_link_directory_audit.json` and never changes the catalog.

## Storefront behavior

Book detail pages build per-book discovery URLs from the manifest-matched title/author when the compact directory is present. Existing saved `book.researchLinks` values take precedence over generated fallbacks. The app matches the directory to a catalog entry by a unique, case-insensitive source filename (after normalizing Windows/POSIX path separators). It does not assume that the CSV row's Manifest ID equals the catalog's numeric ID. After a unique filename match, the research panel displays the original manifest title, unverified contributor field, category, source filename and Manifest ID.

If the compact index is absent or a book has no matching manifest ID, the page still shows the generated research links using the current catalog title/author. The normal catalog, cover pipeline, checkout and delivery continue to work without the optional file.

All links are labelled as unverified search leads. A human reviewer must confirm the matching edition and check the exact image/source license before updating a cover or offering a downloadable file.

## Cover handling

Only a real image URL or a locally stored image that has passed the project's cover-matching and image-quality checks can populate a cover field. Never store Google Images/Wikimedia search-result URLs as `coverImage`. Keep cover provenance, attribution, and license evidence alongside approved cover assets.

## Duplicate handling

Repeated title/author/category groups are review candidates, not automatic duplicates. Different editions, translations, volumes, parts or source files may be legitimate. Never remove rows based only on a title match.


## Vercel runtime file tracing (important)

The 86k catalogue and cover/metadata maps are loaded with server-side filesystem reads. They are not imported into the browser bundle. Next.js standalone/serverless tracing must therefore explicitly include these runtime files for all routes that read them.

`next.config.mjs` now includes the split master catalogue, duplicate map, cover maps, cover URL index, metadata overlay, curated catalogue and research directory for:

- `/api/books` — public catalogue pagination and search
- `/api/covers/[slug]` — per-book cover resolution
- `/book/[slug]` — server-side book detail lookup

If these files are omitted from the Vercel function bundle, local development can appear correct while production silently falls back to a much smaller catalogue and has no cover index to resolve. After deployment, verify that `/api/books?page=1&limit=24` returns the full catalogue count and that a known cover URL returns an image response.

Provider-discovered cover URLs are treated as **review-required**, not as authentic publisher covers. Exact local cover maps can override them. If no suitable cover exists, the cover API returns a 404 so the UI shows a clearly labelled text fallback instead of a fabricated SVG jacket.
