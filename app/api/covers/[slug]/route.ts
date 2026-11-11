import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { getBookBySlug, getBookById } from '@/lib/catalog';
import { OpenLibraryProvider } from '@/lib/discovery/providers/openlibrary';
import { lookupCoverIndex } from '@/lib/cover-url-index';
import { discoverGoogleBooksCovers } from '@/lib/cover-recovery/providers/google-books';
import { pickBestCandidate } from '@/lib/cover-recovery/matcher';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Strip catalog volume suffixes / edition noise so OL + local files can match. */
function cleanSearchTitle(title?: string): string {
  if (!title) return '';
  return title
    .replace(/\s*[—–-]\s*Volume\s+\d+.*$/i, '')
    .replace(/\s+Volume\s+\d+.*$/i, '')
    .replace(/\s*\(Vol\.?\s*\d+.*?\)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function localCoverCandidates(cleanSlug: string, rawSlug: string, book?: { title?: string; author?: string; coverImage?: string } | null): string[] {
  const out: string[] = [];
  const push = (name?: string | null) => {
    if (!name) return;
    const base = name.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
    if (!base) return;
    for (const ext of ['.jpg', '.webp', '.png']) {
      const file = `${base}${ext}`;
      if (!out.includes(file)) out.push(file);
    }
  };

  push(cleanSlug);
  push(rawSlug);

  // Strip trailing -volume-N-ID noise used by master catalog slugs
  const withoutVolume = cleanSlug.replace(/-volume-\d+(-\d+)?$/i, '');
  push(withoutVolume);

  // Progressive prefixes: learning-typescript-enhance-... → learning-typescript
  const parts = withoutVolume.split('-').filter(Boolean);
  for (let i = Math.min(parts.length, 6); i >= 2; i--) {
    push(parts.slice(0, i).join('-'));
  }

  if (book?.coverImage) {
    const basename = path.basename(book.coverImage.split('?')[0]);
    if (basename && !basename.startsWith('standard-shelf')) push(basename);
  }

  if (book?.title) {
    const titleSlug = slugify(cleanSearchTitle(book.title));
    push(titleSlug);
    const titleParts = titleSlug.split('-').filter(Boolean);
    for (let i = Math.min(titleParts.length, 5); i >= 2; i--) {
      push(titleParts.slice(0, i).join('-'));
    }
    if (book.author) {
      push(`${titleSlug}-by-${slugify(book.author)}`);
      push(`${slugify(book.title)}-by-${slugify(book.author)}`);
    }
  }

  return out;
}

function readCoverFile(filePath: string, source: string, filename: string): NextResponse | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    // Tiny / blank stubs
    if (fileBuffer.length < 4000) return null;

    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.webp'
        ? 'image/webp'
        : ext === '.png'
        ? 'image/png'
        : ext === '.svg'
        ? 'image/svg+xml'
        : 'image/jpeg';

    // Reject known dark branded placeholder JPEGs (low entropy / near-black).
    // These were previously labeled AUTHENTIC and blocked remote cover lookup.
    if (contentType === 'image/jpeg' && isLikelyDarkSyntheticJpeg(fileBuffer)) {
      return null;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cover-Source': source,
        'X-Cover-File': filename,
        'X-Cover-Verified': 'true',
      },
    });
  } catch {
    return null;
  }
}

/**
 * Exact SHA-256 prefixes of mass-duplicated placeholder JPEGs previously
 * installed under public/covers/{catalogNum}.jpg (same binary on 200–1700 books).
 * Full hashes live in data/reports/quarantined_placeholder_covers.json after cleanup.
 */
const KNOWN_PLACEHOLDER_SHA256_PREFIXES = [
  'ce5d8075dc1e1ad3', // 10076-byte dark synthetic (~1051 copies)
  '443f2e468fae', // 15361-byte duplicate template (~1794)
  '4a33dbf5a4f7', // 70443-byte duplicate template (~1671)
  'ed7c486adc27', // 27552-byte duplicate template (~438)
  '22f66606e017', // 6747-byte duplicate template (~225)
];

function sha256HexPrefix(buf: Buffer, hexLen = 16): string {
  return createHash('sha256').update(buf).digest('hex').slice(0, hexLen);
}

function isKnownPlaceholderJpeg(buf: Buffer): boolean {
  const full = sha256HexPrefix(buf, 64);
  return KNOWN_PLACEHOLDER_SHA256_PREFIXES.some((prefix) => full.startsWith(prefix));
}

/** Cheap heuristic: sample JPEG SOS entropy / size patterns of AnonTrove dark synthetics. */
function isLikelyDarkSyntheticJpeg(buf: Buffer): boolean {
  if (isKnownPlaceholderJpeg(buf)) return true;
  if (buf.length < 8000 || buf.length > 120000) return false;
  // Marker scan for start-of-scan; then sample payload bytes for near-zero dominance.
  let sos = -1;
  for (let i = 0; i < Math.min(buf.length - 1, 4096); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xda) {
      sos = i + 2;
      break;
    }
  }
  if (sos < 0 || sos >= buf.length) return false;
  const start = Math.min(buf.length - 1, sos + 64);
  const end = Math.min(buf.length, start + 4096);
  if (end - start < 512) return false;
  let low = 0;
  let sum = 0;
  const n = end - start;
  for (let i = start; i < end; i++) {
    const v = buf[i];
    sum += v;
    if (v < 32) low++;
  }
  const mean = sum / n;
  const lowRatio = low / n;
  // Dark branded covers compress to low-mean, high-zero compressed streams.
  return mean < 55 && lowRatio > 0.42;
}

function readLocalCover(
  cleanSlug: string,
  rawSlug: string,
  book?: {
    title?: string;
    author?: string;
    coverImage?: string;
    id?: string;
    catalogNum?: number | string;
    ref?: number | string;
  } | null
): NextResponse | null {
  const coversDir = path.join(process.cwd(), 'public', 'covers');
  const bookCoversDir = path.join(process.cwd(), 'public', 'book-covers');
  const possibleFiles = localCoverCandidates(cleanSlug, rawSlug, book);

  for (const filename of possibleFiles) {
    const hit = readCoverFile(path.join(coversDir, filename), 'local-public-covers', filename);
    if (hit) return hit;
  }

  // Numeric catalog / manifest IDs from the 86k directory CSV / PDF
  const numericIds = [
    book?.catalogNum,
    book?.ref,
    typeof book?.id === 'string' ? book.id.replace(/^book-/, '') : undefined,
    cleanSlug.match(/(\d{2,})$/)?.[1],
    cleanSlug.match(/^(\d+)$/)?.[1],
  ]
    .map((v) => (v == null ? '' : String(v)))
    .filter((v) => /^\d{1,6}$/.test(v));

  for (const id of Array.from(new Set(numericIds))) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const filename = `${id}${ext}`;
      const fromCovers = readCoverFile(path.join(coversDir, filename), 'local-public-covers', filename);
      if (fromCovers) return fromCovers;
      const fromBookCovers = readCoverFile(
        path.join(bookCoversDir, filename),
        'local-book-covers',
        filename
      );
      if (fromBookCovers) return fromBookCovers;
    }
  }

  return null;
}

async function fetchRemoteCover(
  url: string,
  source: string
): Promise<NextResponse | null> {
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'AnonTroveCoverProxy/1.0' },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) return null;
    const buf = Buffer.from(await upstream.arrayBuffer());
    // Tiny payloads are placeholders / default GIFs
    if (buf.length <= 2500) return null;
    if (buf.slice(0, 3).toString('ascii').toUpperCase() === 'GIF' && buf.length < 8000) {
      return null;
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Cover-Source': source,
        'X-Cover-Verified': 'review-required',
      },
    });
  } catch {
    return null;
  }
}

async function fetchOpenLibraryCover(book: {
  title?: string;
  author?: string;
  isbn?: string;
  isbn10?: string;
  isbn13?: string;
} | undefined): Promise<NextResponse | null> {
  if (!book) return null;
  try {
    const isbn = book.isbn13 || book.isbn10 || book.isbn;
    const coverUrls: string[] = [];

    if (isbn && String(isbn).replace(/\D/g, '').length >= 10) {
      coverUrls.push(`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(String(isbn))}-L.jpg`);
    }

    if (book.title) {
      const cleaned = cleanSearchTitle(book.title);
      const titleCore = cleaned.split(/[:—(]/)[0].trim();
      const titleTokens = titleCore.split(/\s+/).filter((w) => w.length > 2).slice(0, 4).join(' ');
      const queries = [
        `${cleaned} ${book.author || ''}`.trim(),
        cleaned,
        titleCore,
        book.author ? `${book.author} ${titleTokens}`.trim() : '',
        book.author ? `${titleTokens} ${book.author}`.trim() : '',
      ].filter((q, i, arr) => q.length >= 4 && arr.indexOf(q) === i);

      const authorNeedle = (book.author || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      for (const query of queries) {
        const docs = await OpenLibraryProvider.searchBooks(query, 10);
        const withCover = docs.filter((d) => d.cover_i || d.cover_id);
        if (!withCover.length) continue;

        const authorMatch = withCover.find((d) => {
          const names = (d.author_name || []).join(' ').toLowerCase();
          return authorNeedle.length > 0 && authorNeedle.every((w) => names.includes(w));
        });
        const pick = authorMatch || withCover[0];
        const url = OpenLibraryProvider.getCoverUrl(pick.cover_i || pick.cover_id || null, 'L');
        if (url && !coverUrls.includes(url)) coverUrls.push(url);
        if (coverUrls.length >= 3) break;
      }
    }

    for (const coverUrl of coverUrls) {
      const hit = await fetchRemoteCover(coverUrl, 'open-library');
      if (hit) return hit;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchGoogleBooksCover(book: {
  title?: string;
  author?: string;
  isbn?: string;
  isbn10?: string;
  isbn13?: string;
} | undefined): Promise<NextResponse | null> {
  if (!book?.title) return null;
  try {
    const candidates = await discoverGoogleBooksCovers({
      title: book.title,
      author: book.author,
      isbn13: book.isbn13 || (book.isbn?.length === 13 ? book.isbn : undefined),
      isbn10: book.isbn10 || (book.isbn?.length === 10 ? book.isbn : undefined),
    });
    const preferred = pickBestCandidate(candidates) || candidates[0];
    if (!preferred?.coverUrl) return null;
    return await fetchRemoteCover(preferred.coverUrl, 'google-books');
  } catch {
    return null;
  }
}

async function fetchInternetArchiveCover(book: {
  title?: string;
  author?: string;
} | undefined): Promise<NextResponse | null> {
  if (!book?.title) return null;
  try {
    const cleaned = cleanSearchTitle(book.title).split(/[:—(]/)[0].trim();
    const clauses = [`title:(${cleaned})`];
    if (book.author) clauses.push(`creator:(${book.author.split(',')[0].trim()})`);
    const q = clauses.join(' AND ');
    const res = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&rows=5&page=1&output=json`,
      { headers: { 'User-Agent': 'AnonTroveCoverProxy/1.0' }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const docs = data?.response?.docs || [];
    for (const doc of docs) {
      if (!doc?.identifier) continue;
      const hit = await fetchRemoteCover(
        `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
        'internet-archive'
      );
      if (hit) return hit;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rawSlug = params.slug;
  const cleanSlug = rawSlug.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
  const forceLocal = req.nextUrl.searchParams.get('local') === '1';

  const resolved =
    getBookBySlug(cleanSlug) ||
    getBookById(cleanSlug) ||
    getBookById(`book-${cleanSlug}`);

  // Master-catalog slugs often miss exact lookup; derive a searchable title from the slug.
  const slugTitle = cleanSlug
    .replace(/-volume-\d+(-\d+)?$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\d{4,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const book = resolved || {
    title: slugTitle,
    author: undefined,
    coverImage: undefined,
    coverType: 'CUSTOM_ARTWORK' as const,
    category: 'Curated Study Edition',
    pages: 320,
  };

  // Local first (skipping dark synthetics), then 86k index, then live free APIs.
  if (forceLocal) {
    const localForced = readLocalCover(cleanSlug, rawSlug, book);
    if (localForced) return localForced;
  }

  const localEarly = readLocalCover(cleanSlug, rawSlug, book);
  if (localEarly) return localEarly;

  const indexed = lookupCoverIndex(cleanSlug, book as any);
  if (indexed?.coverUrl && /^https?:\/\//i.test(indexed.coverUrl)) {
    const cachedRemote = await fetchRemoteCover(
      indexed.coverUrl,
      indexed.coverSource || 'cover-index'
    );
    if (cachedRemote) return cachedRemote;
  }

  // Google Books first (API key preferred; anonymous hits 429 quickly).
  const gb = await fetchGoogleBooksCover(book as {
    title?: string;
    author?: string;
    isbn?: string;
    isbn10?: string;
    isbn13?: string;
  });
  if (gb) return gb;

  const ia = await fetchInternetArchiveCover(book);
  if (ia) return ia;

  const ol = await fetchOpenLibraryCover(book);
  if (ol) return ol;

  const bookAny = book as { title?: string; author?: string; category?: string; isbn?: string; isbn10?: string; isbn13?: string; pages?: number };
  const title = escapeXml(bookAny.title || cleanSlug.replace(/[-_]/g, ' ').toUpperCase());
  const author = escapeXml(bookAny.author || 'AnonTrove Editorial Guild');
  const category = escapeXml(bookAny.category || 'Curated Study Edition');
  const isbn = escapeXml(bookAny.isbn13 || bookAny.isbn10 || bookAny.isbn || 'DRM-FREE-VERIFIED');
  const pages = bookAny.pages || 320;

  let primaryColor = '#10B981';
  const catLower = category.toLowerCase();
  if (catLower.includes('business') || catLower.includes('finance') || catLower.includes('startup')) {
    primaryColor = '#3B82F6';
  } else if (catLower.includes('security') || catLower.includes('hack') || catLower.includes('python')) {
    primaryColor = '#10B981';
  } else if (catLower.includes('hindi') || catLower.includes('literature')) {
    primaryColor = '#F97316';
  } else if (catLower.includes('classic') || catLower.includes('philosophy')) {
    primaryColor = '#A855F7';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7F3EA"/>
      <stop offset="100%" stop-color="#E8E1D2"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#paper)"/>
  <rect x="28" y="28" width="544" height="844" fill="none" stroke="#1F2937" stroke-width="3"/>
  <rect x="28" y="28" width="544" height="132" fill="${primaryColor}"/>
  <text x="50" y="110" font-family="Georgia, Cambria, serif" font-size="28" font-weight="700" fill="#FFFFFF">${title.slice(0, 28)}</text>
  <text x="50" y="220" font-family="Georgia, serif" font-size="22" fill="#111827">
    <tspan x="50" dy="0">${title.slice(0, 34)}</tspan>
    ${title.length > 34 ? `<tspan x="50" dy="32">${title.slice(34, 68)}</tspan>` : ''}
  </text>
  <text x="50" y="320" font-family="Georgia, serif" font-size="18" fill="#374151">By ${author.slice(0, 40)}</text>
  <rect x="50" y="350" width="160" height="4" fill="${primaryColor}"/>
  <text x="50" y="410" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" fill="#4B5563">${category.slice(0, 40)}</text>
  <text x="50" y="450" font-family="monospace" font-size="12" fill="#6B7280">${pages} pages · DRM-free digital edition</text>
  <text x="50" y="820" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#6B7280">ANONTROVE ARCHIVE</text>
  <text x="50" y="848" font-family="monospace" font-size="11" fill="#9CA3AF">ISBN ${isbn}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Cover-Source': 'synthetic-svg',
      'X-Cover-Verified': 'false',
    },
  });
}
