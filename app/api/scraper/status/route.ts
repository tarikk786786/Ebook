import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveredBooks, getCatalogMetadata, getSourceRegistry } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const books = getDiscoveredBooks();
    const metadata = getCatalogMetadata();
    const sources = getSourceRegistry();

    const stats = {
      totalSources: sources.length,
      activeSources: sources.filter((s) => s.connectionStatus === 'ACTIVE').length,
      rateLimitedSources: sources.filter((s) => s.connectionStatus === 'AUTH_KEY_REQUIRED_RATE_LIMITED').length,
      totalDiscoveredBooks: books.length,
      publicDomainBooks: books.filter((b) => b.availability === 'PUBLIC_DOMAIN').length,
      freeAuthorizedBooks: books.filter((b) => b.availability === 'FREE_AUTHORIZED' || b.availability === 'OPEN_ACCESS').length,
      borrowableBooks: books.filter((b) => b.availability === 'BORROWABLE').length,
      paidStoreBooks: books.filter((b) => b.availability === 'PAID_STORE').length,
      previewOnlyBooks: books.filter((b) => b.availability === 'PREVIEW_ONLY').length,
      telegramDiscoveries: books.filter((b) => b.sourceId.includes('telegram')).length,
      websiteDiscoveries: books.filter((b) => !b.sourceId.includes('telegram')).length,
      lastSynced: metadata.lastSynced,
      scanDurationSeconds: metadata.scanDurationSeconds
    };

    return NextResponse.json({
      success: true,
      stats,
      metadata,
      sources,
      recentDiscoveries: books.slice(0, 10)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
