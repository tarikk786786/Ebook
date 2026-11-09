import { NextRequest, NextResponse } from 'next/server';
import { getAllDiscoveryBooks, getDiscoveryCategories } from '@/lib/discovery/catalog';
import { DiscoveryStore } from '@/lib/discovery/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const books = getAllDiscoveryBooks();
    const categories = getDiscoveryCategories();
    const discoveryStats = DiscoveryStore.getDiscoveryStats();

    let verifiedCount = 0;
    let partiallyVerifiedCount = 0;
    let withIsbn = 0;
    let withCover = 0;

    for (const b of books) {
      if (b.verificationStatus === 'VERIFIED') verifiedCount++;
      else if (b.verificationStatus === 'PARTIALLY_VERIFIED') partiallyVerifiedCount++;
      if (b.isbn13 || b.isbn10) withIsbn++;
      if (b.coverUrl) withCover++;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBooks: books.length,
        totalCategories: categories.length,
        verifiedCount,
        partiallyVerifiedCount,
        discoveredCount: books.length - (verifiedCount + partiallyVerifiedCount),
        withIsbn,
        withCover,
        source: 'Open Library • Google Books API • Internet Archive • Master Archive',
        // New real-time multi-provider discovery metrics
        automatedDiscovery: discoveryStats
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
