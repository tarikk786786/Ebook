import fs from 'fs';
import path from 'path';

export type CoverIndexEntry = {
  catalogNum?: number;
  slug?: string;
  title?: string;
  author?: string;
  category?: string;
  coverUrl?: string;
  coverImage?: string;
  olCoverId?: number | null;
  coverSource?: string;
  coverVerified?: boolean;
  localPath?: string | null;
};

let cached: Map<string, CoverIndexEntry> | null = null;

export function getCoverUrlIndex(): Map<string, CoverIndexEntry> {
  if (cached) return cached;
  cached = new Map();
  try {
    const indexPath = path.resolve(process.cwd(), 'data', 'catalog', 'cover_url_index_86k.json');
    if (!fs.existsSync(indexPath)) return cached;
    const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const map = payload.map || {};
    for (const [key, entry] of Object.entries(map)) {
      cached.set(key, entry as CoverIndexEntry);
    }
  } catch {
    // ignore malformed index
  }
  return cached;
}

export function lookupCoverIndex(slug: string, book?: { id?: string; title?: string; catalogNum?: number | string; ref?: number | string; researchSource?: { manifestId?: number } } | null): CoverIndexEntry | undefined {
  const index = getCoverUrlIndex();
  const normalizeNumeric = (value: number | string | undefined): string => {
    if (value == null) return '';
    const raw = String(value).trim();
    return /^\d+$/.test(raw) ? raw.replace(/^0+(?=\d)/, '') : raw;
  };
  const catalogNum = normalizeNumeric(book?.catalogNum);
  const ref = normalizeNumeric(book?.ref);
  const manifestId = normalizeNumeric(book?.researchSource?.manifestId);
  const id = normalizeNumeric(book?.id?.replace(/^book-/, ''));
  const trailingRef = normalizeNumeric(slug.match(/(\d{2,})$/)?.[1]);
  const candidates = [
    slug,
    catalogNum ? `ref:${catalogNum}` : '',
    ref ? `ref:${ref}` : '',
    manifestId ? `ref:${manifestId}` : '',
    catalogNum,
    ref,
    manifestId,
    id,
    trailingRef ? `ref:${trailingRef}` : '',
  ].filter(Boolean) as string[];

  const normalizeTitle = (value: string) => value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  for (const key of candidates) {
    const hit = index.get(key);
    if (!hit || (!hit.coverUrl && !hit.coverImage)) continue;
    // Numeric refs are reused by multiple catalogue exports. Never accept a
    // ref hit whose indexed title belongs to a different book.
    if (book?.title && hit.title) {
      const wanted = normalizeTitle(book.title);
      const indexed = normalizeTitle(hit.title);
      if (wanted !== indexed && !wanted.startsWith(indexed) && !indexed.startsWith(wanted)) continue;
    }
    return hit;
  }
  return undefined;
}
