import type { BookIdentity, CoverCandidate } from '../types';
import { scoreCandidate } from '../matcher';

const BASE = 'https://www.googleapis.com/books/v1/volumes';

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Volume\s+\d+.*$/i, '')
    .replace(/\s+Volume\s+\d+.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function upgradeCoverUrl(raw: string): string {
  return raw
    .replace(/^http:\/\//i, 'https://')
    .replace(/&edge=curl/gi, '')
    .replace(/zoom=\d/i, 'zoom=2');
}

export async function discoverGoogleBooksCovers(
  book: BookIdentity,
  opts: { signal?: AbortSignal } = {}
): Promise<CoverCandidate[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  const cleaned = cleanTitle(book.title || '');
  const titleCore = cleaned.split(/[:—(]/)[0].trim();
  if (titleCore.length < 3) return [];

  const queries: string[] = [];
  if (book.isbn13) queries.push(`isbn:${book.isbn13}`);
  if (book.isbn10) queries.push(`isbn:${book.isbn10}`);
  let titleAuthor = `intitle:"${titleCore}"`;
  if (book.author) {
    const author = book.author.split(',')[0].trim();
    if (author) titleAuthor += ` inauthor:"${author}"`;
  }
  queries.push(titleAuthor);
  queries.push(`intitle:"${titleCore}"`);

  const out: CoverCandidate[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const params = new URLSearchParams({
      q,
      maxResults: '5',
      printType: 'books',
    });
    if (apiKey) params.set('key', apiKey);

    try {
      const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'AnonTroveCoverRecovery/1.0 (mailto:apnix7@gmail.com)' },
        signal: opts.signal,
        next: { revalidate: 3600 },
      });
      if (res.status === 429) break;
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data?.items || []) {
        const vi = item?.volumeInfo || {};
        const links = vi.imageLinks || {};
        const raw =
          links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
        if (!raw) continue;
        const coverUrl = upgradeCoverUrl(String(raw));
        if (seen.has(coverUrl)) continue;
        seen.add(coverUrl);

        const ids: Array<{ type?: string; identifier?: string }> = vi.industryIdentifiers || [];
        const isbn13 = ids.find((i) => i.type === 'ISBN_13')?.identifier;
        const isbn10 = ids.find((i) => i.type === 'ISBN_10')?.identifier;
        const year = String(vi.publishedDate || '').slice(0, 4);

        const scored = scoreCandidate(book, {
          provider: 'google-books',
          coverUrl,
          sourceId: item.id,
          title: vi.title,
          authors: vi.authors || [],
          isbn13,
          isbn10,
          publisher: vi.publisher,
          publishedYear: year || undefined,
          confidence: 'MEDIUM',
          reason: 'google-books hit',
        });
        out.push(scored);
      }
      if (out.some((c) => c.confidence === 'HIGH')) break;
    } catch {
      continue;
    }
  }

  return out;
}

export function googleBooksKeyConfigured(): boolean {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim());
}
