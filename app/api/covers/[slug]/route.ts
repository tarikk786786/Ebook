import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBookBySlug, getBookById } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const rawSlug = params.slug;
  const cleanSlug = rawSlug.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');

  // 1. Check if a physical authentic cover exists in public/covers/
  const coversDir = path.join(process.cwd(), 'public', 'covers');
  const possibleFiles = [
    `${cleanSlug}.jpg`,
    `${cleanSlug}.webp`,
    `${cleanSlug}.png`,
    `${rawSlug}`,
  ];

  for (const filename of possibleFiles) {
    const filePath = path.join(coversDir, filename);
    if (fs.existsSync(filePath)) {
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
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch (err) {
        // Fallback to dynamic generator
      }
    }
  }

  // 2. Lookup book metadata from catalog or dynamic registries
  const book = getBookBySlug(cleanSlug) || getBookById(cleanSlug) || getBookById(`book-${cleanSlug}`);

  const title = escapeXml(book?.title || cleanSlug.replace(/[-_]/g, ' ').toUpperCase());
  const author = escapeXml(book?.author || 'AnonTrove Editorial Guild');
  const category = escapeXml(book?.category || 'Curated Study Edition');
  const isbn = escapeXml(book?.isbn13 || book?.isbn10 || 'DRM-FREE-VERIFIED');
  const pages = book?.pages || 320;

  // Dynamic palette based on category
  let primaryColor = '#10B981'; // emerald
  const catLower = category.toLowerCase();
  if (catLower.includes('business') || catLower.includes('finance') || catLower.includes('startup')) {
    primaryColor = '#3B82F6'; // blue
  } else if (catLower.includes('security') || catLower.includes('hack') || catLower.includes('python')) {
    primaryColor = '#10B981'; // emerald
  } else if (catLower.includes('hindi') || catLower.includes('literature')) {
    primaryColor = '#F97316'; // orange
  } else if (catLower.includes('classic') || catLower.includes('philosophy')) {
    primaryColor = '#A855F7'; // purple
  }

  // 3. Render high-resolution 600x900 authentic publisher hardcover SVG
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
    <linearGradient id="spineShadow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.8"/>
      <stop offset="3%" stop-color="#FFFFFF" stop-opacity="0.12"/>
      <stop offset="6%" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="10%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <filter id="emboss" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Hardcover Base -->
  <rect width="600" height="900" fill="url(#cloth)"/>

  <!-- Outer Foiled Border Frame -->
  <rect x="28" y="28" width="544" height="844" rx="10" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-opacity="0.7"/>
  <rect x="36" y="36" width="528" height="828" rx="6" fill="none" stroke="#E2E8F0" stroke-width="1" stroke-opacity="0.15"/>

  <!-- Book Spine Visual Lighting -->
  <rect x="0" y="0" width="45" height="900" fill="url(#spineShadow)"/>

  <!-- Top Series Header -->
  <g transform="translate(300, 95)" text-anchor="middle">
    <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="5" fill="${primaryColor}">ANONTROVE STANDARD EDITION</text>
    <text y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" letter-spacing="2" fill="#94A3B8">VERIFIED UNABRIDGED MANUSCRIPT</text>
  </g>

  <!-- Central Title Display Box -->
  <g transform="translate(60, 200)">
    <rect width="480" height="420" rx="14" fill="#0B0F19" fill-opacity="0.85" stroke="#334155" stroke-width="1.5" filter="url(#emboss)"/>

    <!-- Category Pill -->
    <rect x="120" y="32" width="240" height="28" rx="14" fill="#1E293B" stroke="${primaryColor}" stroke-width="1" stroke-opacity="0.5"/>
    <text x="240" y="50" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="${primaryColor}" text-anchor="middle">${category.slice(0, 30)}</text>

    <!-- Main Title (Wrapped) -->
    <text x="240" y="140" font-family="Georgia, Cambria, serif" font-size="26" font-weight="bold" fill="#F8FAFC" text-anchor="middle" filter="url(#emboss)">
      <tspan x="240" dy="0">${title.slice(0, 30)}</tspan>
      ${title.length > 30 ? `<tspan x="240" dy="34">${title.slice(30, 60)}</tspan>` : ''}
      ${title.length > 60 ? `<tspan x="240" dy="34">${title.slice(60, 90)}</tspan>` : ''}
    </text>

    <!-- Decorative Gold Divider -->
    <line x1="160" y1="270" x2="320" y2="270" stroke="url(#gold)" stroke-width="2"/>
    <circle cx="240" cy="270" r="4" fill="url(#gold)"/>

    <!-- Author Line -->
    <text x="240" y="315" font-family="Georgia, serif" font-style="italic" font-size="17" font-weight="600" fill="url(#gold)" text-anchor="middle">
      By ${author.slice(0, 36)}
    </text>

    <!-- Specs Subtext -->
    <text x="240" y="365" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">
      ${pages} Pages • Universal PDF &amp; EPUB • DRM-Free
    </text>
  </g>

  <!-- Bottom Publisher Seal & ISBN Barcode Representation -->
  <g transform="translate(300, 750)" text-anchor="middle">
    <circle cx="0" cy="0" r="26" fill="none" stroke="${primaryColor}" stroke-width="2"/>
    <polygon points="0,-16 12,12 -12,12" fill="${primaryColor}" opacity="0.8"/>
    <text y="48" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="800" letter-spacing="4" fill="#F8FAFC">ANONTROVE ARCHIVE</text>
    <text y="68" font-family="monospace" font-size="10" fill="#64748B">ISBN ${isbn}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
