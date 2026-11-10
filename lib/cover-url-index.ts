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

export function lookupCoverIndex(slug: string, book?: { id?: string; catalogNum?: number | string; ref?: number | string } | null): CoverIndexEntry | undefined {
  const index = getCoverUrlIndex();
  const candidates = [
    slug,
    book?.catalogNum != null ? `ref:${book.catalogNum}` : '',
    book?.ref != null ? `ref:${book.ref}` : '',
    book?.catalogNum != null ? String(book.catalogNum) : '',
    book?.id?.replace(/^book-/, ''),
    slug.match(/(\d{2,})$/)?.[1] ? `ref:${slug.match(/(\d{2,})$/)?.[1]}` : '',
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    const hit = index.get(key);
    if (hit?.coverUrl || hit?.coverImage) return hit;
  }
  return undefined;
}
