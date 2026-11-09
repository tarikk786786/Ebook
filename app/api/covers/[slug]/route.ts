import { NextRequest, NextResponse } from 'next/server';
import { getBookBySlug, getBookById } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
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
  const slug = params.slug.replace(/\.(jpg|jpeg|png|svg)$/i, '');
  const book = getBookBySlug(slug) || getBookById(slug);

  const title = escapeXml(book?.title || slug.replace(/-/g, ' ').toUpperCase());
  const author = escapeXml(book?.author || 'AnonTrove Guild');
  const category = escapeXml(book?.category || 'Master Study Edition');

  // Dynamic SVG book cover (600x800)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17"/>
      <stop offset="50%" stop-color="#121826"/>
      <stop offset="100%" stop-color="#070A0F"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="800" fill="url(#bg)"/>

  <!-- Border Frames -->
  <rect x="24" y="24" width="552" height="752" rx="12" fill="none" stroke="#10B981" stroke-width="2" stroke-opacity="0.6"/>
  <rect x="32" y="32" width="536" height="736" rx="8" fill="none" stroke="#1E293B" stroke-width="1"/>

  <!-- Top Badge -->
  <text x="300" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#10B981" text-anchor="middle">ANONTROVE ARCHIVE</text>
  <text x="300" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="500" letter-spacing="2" fill="#94A3B8" text-anchor="middle">VERIFIED DRM-FREE EDITION</text>

  <!-- Central Card -->
  <rect x="56" y="200" width="488" height="400" rx="16" fill="#0F172A" fill-opacity="0.8" stroke="#334155" stroke-width="1.5"/>

  <!-- Category Pill -->
  <rect x="180" y="240" width="240" height="28" rx="14" fill="#1E293B" stroke="#475569" stroke-width="1"/>
  <text x="300" y="258" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#38BDF8" text-anchor="middle">${category.slice(0, 32)}</text>

  <!-- Title & Author -->
  <text x="300" y="340" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
    <tspan x="300" dy="0">${title.slice(0, 32)}</tspan>
    ${title.length > 32 ? `<tspan x="300" dy="32">${title.slice(32, 64)}</tspan>` : ''}
  </text>
  <text x="300" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="url(#gold)" text-anchor="middle">By ${author.slice(0, 40)}</text>

  <!-- Divider -->
  <line x1="220" y1="480" x2="380" y2="480" stroke="#334155" stroke-width="1"/>
  <text x="300" y="520" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">Full Unabridged Content · Universal Reader</text>

  <!-- Bottom Seal -->
  <text x="300" y="700" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" letter-spacing="3" fill="#10B981" text-anchor="middle">CRYPTOGRAPHICALLY SEALED</text>
  <text x="300" y="725" font-family="monospace" font-size="9" fill="#64748B" text-anchor="middle">AnonTrove Global Knowledge Guild</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
