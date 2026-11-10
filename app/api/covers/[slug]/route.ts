import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBookBySlug, getBookById } from '@/lib/catalog';
import { OpenLibraryProvider } from '@/lib/discovery/providers/openlibrary';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function readLocalCover(cleanSlug: string, rawSlug: string): NextResponse | null {
  const coversDir = path.join(process.cwd(), 'public', 'covers');
  const possibleFiles = [
    `${cleanSlug}.jpg`,
    `${cleanSlug}.webp`,
    `${cleanSlug}.png`,
    `${rawSlug}`,
  ];

  for (const filename of possibleFiles) {
    const filePath = path.join(coversDir, filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === '.webp'
          ? 'image/webp'
          : ext === '.png'
          ? 'image/png'
          : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/jpeg';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'X-Cover-Source': 'local-public-covers',
          'X-Cover-Verified': 'true',
        },
      });
    } catch {
      // try next candidate
    }
  }
  return null;
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
    let coverUrl: string | null = null;
    if (isbn) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
    } else if (book.title) {
      const query = `${book.title} ${book.author || ''}`.trim();
      const docs = await OpenLibraryProvider.searchBooks(query, 5);
      const withCover = docs.find((d) => d.cover_i || d.cover_id);
      coverUrl = OpenLibraryProvider.getCoverUrl(withCover?.cover_i || withCover?.cover_id || null, 'L');
    }
    if (!coverUrl) return null;

    const upstream = await fetch(coverUrl, {
      headers: { 'User-Agent': 'AnonTroveCoverProxy/1.0' },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) return null;
    const buf = Buffer.from(await upstream.arrayBuffer());
    // Open Library returns a tiny placeholder for missing covers
    if (buf.length <= 2500) return null;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Cover-Source': 'open-library',
        'X-Cover-Verified': 'review-required',
      },
    });
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

  const book =
    getBookBySlug(cleanSlug) ||
    getBookById(cleanSlug) ||
    getBookById(`book-${cleanSlug}`);

  // Prefer real Open Library art for CUSTOM_ARTWORK / unverified local synthetics.
  // Keep authentic local scans first when coverType is AUTHENTIC.
  const preferLocalFirst = forceLocal || book?.coverType === 'AUTHENTIC';

  if (preferLocalFirst) {
    const local = readLocalCover(cleanSlug, rawSlug);
    if (local) return local;
  }

  const ol = await fetchOpenLibraryCover(book);
  if (ol) return ol;

  if (!preferLocalFirst) {
    const local = readLocalCover(cleanSlug, rawSlug);
    if (local) return local;
  }

  const title = escapeXml(book?.title || cleanSlug.replace(/[-_]/g, ' ').toUpperCase());
  const author = escapeXml(book?.author || 'AnonTrove Editorial Guild');
  const category = escapeXml(book?.category || 'Curated Study Edition');
  const isbn = escapeXml(book?.isbn13 || book?.isbn10 || 'DRM-FREE-VERIFIED');
  const pages = book?.pages || 320;

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
    <linearGradient id="cloth" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141824"/>
      <stop offset="40%" stop-color="#1B2234"/>
      <stop offset="100%" stop-color="#0E121B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#cloth)"/>
  <rect x="28" y="28" width="544" height="844" rx="10" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-opacity="0.7"/>
  <g transform="translate(300, 95)" text-anchor="middle">
    <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="5" fill="${primaryColor}">ANONTROVE STANDARD EDITION</text>
  </g>
  <g transform="translate(60, 200)">
    <rect width="480" height="420" rx="14" fill="#0B0F19" fill-opacity="0.85" stroke="#334155" stroke-width="1.5"/>
    <text x="240" y="50" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="${primaryColor}" text-anchor="middle">${category.slice(0, 30)}</text>
    <text x="240" y="140" font-family="Georgia, Cambria, serif" font-size="26" font-weight="bold" fill="#F8FAFC" text-anchor="middle">
      <tspan x="240" dy="0">${title.slice(0, 30)}</tspan>
      ${title.length > 30 ? `<tspan x="240" dy="34">${title.slice(30, 60)}</tspan>` : ''}
      ${title.length > 60 ? `<tspan x="240" dy="34">${title.slice(60, 90)}</tspan>` : ''}
    </text>
    <text x="240" y="315" font-family="Georgia, serif" font-style="italic" font-size="17" font-weight="600" fill="url(#gold)" text-anchor="middle">
      By ${author.slice(0, 36)}
    </text>
    <text x="240" y="365" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">
      ${pages} Pages • Universal PDF &amp; EPUB • DRM-Free
    </text>
  </g>
  <g transform="translate(300, 750)" text-anchor="middle">
    <text y="48" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="800" letter-spacing="4" fill="#F8FAFC">ANONTROVE ARCHIVE</text>
    <text y="68" font-family="monospace" font-size="10" fill="#64748B">ISBN ${isbn}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Cover-Source': 'synthetic-svg',
      'X-Cover-Verified': 'false',
    },
  });
}
