import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { getBookBySlug, getBookById } from '@/lib/catalog';
import { discoverOpenLibraryCovers } from '@/lib/cover-recovery/providers/open-library';
import { lookupCoverIndex } from '@/lib/cover-url-index';
import { discoverGoogleBooksCovers } from '@/lib/cover-recovery/providers/google-books';
import { pickBestCandidate } from '@/lib/cover-recovery/matcher';

export const dynamic = 'force-dynamic';

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
    .map((v) => (v == null ? '' : String(v).replace(/^0+(?=\d)/, '')))
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

function readIndexedCover(indexedPath?: string | null): NextResponse | null {
  if (!indexedPath || !indexedPath.startsWith('/')) return null;
  const normalized = indexedPath.split('?')[0];
  const match = normalized.match(/^\/(covers|book-covers)\/([a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp))$/i);
  if (!match) return null;
  const folder = match[1] === 'covers' ? 'covers' : 'book-covers';
  const filename = path.basename(match[2]);
  const root = path.join(process.cwd(), 'public', folder);
  return readCoverFile(path.join(root, filename), 'cover-url-index', filename);
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
  if (!book?.title) return null;
  try {
    const candidates = await discoverOpenLibraryCovers({
      title: book.title,
      author: book.author,
      isbn13: book.isbn13 || (book.isbn?.length === 13 ? book.isbn : undefined),
      isbn10: book.isbn10 || (book.isbn?.length === 10 ? book.isbn : undefined),
    });
    // Reject LOW-confidence title-only guesses. Medium/high matches remain
    // visibly labelled review-required in the UI until an editor approves them.
    const preferred = pickBestCandidate(candidates);
    if (!preferred?.coverUrl) return null;
    return await fetchRemoteCover(preferred.coverUrl, 'open-library');
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
    const preferred = pickBestCandidate(candidates);
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

function xmlEscape(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createCustomCoverSvg(book: { title?: string; author?: string; category?: string }, slug: string): string {
  const palettes = [
    ['#102A43', '#243B53', '#D9A441'],
    ['#2D1B36', '#56334E', '#E7B7A0'],
    ['#12372A', '#315C45', '#D7B56D'],
    ['#252B48', '#4A527A', '#B8C6E5'],
    ['#4A241D', '#8C4B35', '#E7B46A'],
    ['#16324F', '#315B75', '#A9D6E5'],
  ];
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const [start, end, accent] = palettes[hash % palettes.length];
  const title = String(book.title || 'Untitled eBook').trim();
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (next.length > 22 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, 5);
  if (lines.length > 5) visibleLines[4] = visibleLines[4].replace(/[.,;:!?]?$/, '…');
  const titleMarkup = visibleLines.map((value, index) =>
    `<text x="48" y="${290 + index * 45}" font-family="Georgia,serif" font-size="32" font-weight="700" fill="#FFFFFF">${xmlEscape(value)}</text>`
  ).join('');
  const author = xmlEscape(String(book.author || 'Author details pending').slice(0, 48));
  const category = xmlEscape(String(book.category || 'Digital Library').slice(0, 34));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640" role="img" aria-label="Custom cover art for ${xmlEscape(title)}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}" stop-opacity=".95"/><stop offset="1" stop-color="${accent}" stop-opacity=".1"/></linearGradient>
      <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#FFFFFF" stroke-opacity=".07" stroke-width="1"/></pattern>
    </defs>
    <rect width="480" height="640" fill="url(#bg)"/>
    <rect width="480" height="640" fill="url(#grid)"/>
    <circle cx="405" cy="112" r="126" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="2"/>
    <circle cx="405" cy="112" r="92" fill="none" stroke="${accent}" stroke-opacity=".22" stroke-width="1"/>
    <path d="M0 460 C130 400 230 560 480 430 L480 640 L0 640Z" fill="#07131F" fill-opacity=".28"/>
    <path d="M48 82H180" stroke="url(#shine)" stroke-width="5" stroke-linecap="round"/>
    <text x="48" y="120" font-family="Arial,sans-serif" font-size="15" letter-spacing="3" font-weight="700" fill="${accent}">ANONTROVE  /  DIGITAL LIBRARY</text>
    <text x="48" y="218" font-family="Arial,sans-serif" font-size="13" letter-spacing="2" fill="#FFFFFF" fill-opacity=".72">${category.toUpperCase()}</text>
    ${titleMarkup}
    <path d="M48 520H432" stroke="#FFFFFF" stroke-opacity=".28"/>
    <text x="48" y="555" font-family="Arial,sans-serif" font-size="16" fill="#FFFFFF" fill-opacity=".9">${author}</text>
    <rect x="48" y="580" width="236" height="28" rx="14" fill="#FFFFFF" fill-opacity=".12" stroke="#FFFFFF" stroke-opacity=".24"/>
    <text x="166" y="599" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" letter-spacing="1.3" font-weight="700" fill="#FFFFFF">CUSTOM COVER ART</text>
    <text x="432" y="622" text-anchor="end" font-family="Arial,sans-serif" font-size="9" letter-spacing="1" fill="#FFFFFF" fill-opacity=".62">PUBLISHER COVER NOT FOUND</text>
  </svg>`;
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

  // Resolve the precomputed 86k index before fuzzy title/API fallbacks.
  // Most index entries are local paths (/covers/{catalogNum}.jpg), not URLs.
  const indexed = lookupCoverIndex(cleanSlug, book as any);
  const indexedCoverPath = indexed?.coverImage || indexed?.coverUrl;
  if (indexedCoverPath?.startsWith('/')) {
    const indexedLocal = readIndexedCover(indexedCoverPath);
    if (indexedLocal) return indexedLocal;
  }

  // Then try title/slug-derived local files, followed by remote indexed URLs.
  if (forceLocal) {
    const localForced = readLocalCover(cleanSlug, rawSlug, book);
    if (localForced) return localForced;
  }

  const explicitBookCover = readIndexedCover(book.coverImage);
  if (explicitBookCover) return explicitBookCover;

  const localEarly = readLocalCover(cleanSlug, rawSlug, book);
  if (localEarly) return localEarly;

  const indexedCoverUrl = indexed?.coverUrl || indexed?.coverImage;
  if (indexedCoverUrl && /^https?:\/\//i.test(indexedCoverUrl)) {
    const cachedRemote = await fetchRemoteCover(
      indexedCoverUrl,
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

  // Prefer bibliographic ISBN/title matches before archive item thumbnails.
  const ol = await fetchOpenLibraryCover(book);
  if (ol) return ol;

  const ia = await fetchInternetArchiveCover(book);
  if (ia) return ia;

  // Keep every catalogue card visually complete without pretending an
  // unverified graphic is the publisher's original cover. The label is embedded
  // in the artwork and the response headers remain explicitly unverified.
  return new NextResponse(createCustomCoverSvg(book, cleanSlug), {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'X-Cover-Source': 'generated-custom-artwork',
      'X-Cover-Verified': 'false',
    },
  });
}
