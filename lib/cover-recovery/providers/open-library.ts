import type { BookIdentity, CoverCandidate } from '../types';
import { scoreCandidate } from '../matcher';

const SEARCH = 'https://openlibrary.org/search.json';
const COVERS = 'https://covers.openlibrary.org/b';

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Volume\s+\d+.*$/i, '')
    .replace(/\s+Volume\s+\d+.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Open Library discovery via Search API (metadata).
 * Cover URLs use cover_i / ISBN — one-off lookups only (no bulk Covers API crawl).
 */
export async function discoverOpenLibraryCovers(
  book: BookIdentity,
  opts: { signal?: AbortSignal } = {}
): Promise<CoverCandidate[]> {
  const out: CoverCandidate[] = [];
  const seen = new Set<string>();

  if (book.isbn13 || book.isbn10) {
    const isbn = book.isbn13 || book.isbn10!;
    const coverUrl = `${COVERS}/isbn/${isbn}-L.jpg?default=false`;
    const scored = scoreCandidate(book, {
      provider: 'open-library',
      coverUrl,
      sourceId: `isbn:${isbn}`,
      isbn13: book.isbn13,
      isbn10: book.isbn10,
      confidence: 'HIGH',
      reason: 'open-library isbn cover',
    });
    out.push(scored);
    seen.add(coverUrl);
  }

  const title = cleanTitle(book.title || '').split(/[:—(]/)[0].trim();
  if (title.length < 3) return out;

  const params = new URLSearchParams({
    title,
    limit: '5',
  });
  if (book.author) {
    const author = book.author.split(',')[0].trim();
    if (
      author &&
      !/^(editorial board|anontrove|unknown|author not verified|n\/?a)$/i.test(author)
    ) {
      params.set('author', author);
    }
  }

  try {
    const res = await fetch(`${SEARCH}?${params.toString()}`, {
      headers: { 'User-Agent': 'AnonTroveCoverRecovery/1.0 (mailto:apnix7@gmail.com)' },
      signal: opts.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return out;
    const data = await res.json();
    for (const doc of data?.docs || []) {
      const coverI = doc?.cover_i;
      if (!coverI || Number(coverI) <= 0) continue;
      const coverUrl = `${COVERS}/id/${coverI}-L.jpg?default=false`;
      if (seen.has(coverUrl)) continue;
      seen.add(coverUrl);
      const year = String(doc.first_publish_year || '').slice(0, 4);
      const scored = scoreCandidate(book, {
        provider: 'open-library',
        coverUrl,
        sourceId: String(doc.key || coverI),
        title: doc.title,
        authors: doc.author_name || [],
        isbn13: (doc.isbn || []).find((x: string) => String(x).length === 13),
        isbn10: (doc.isbn || []).find((x: string) => String(x).length === 10),
        publishedYear: year || undefined,
        confidence: 'MEDIUM',
        reason: 'open-library search cover_i',
      });
      out.push(scored);
    }
  } catch {
    // soft-fail
  }

  return out;
}
