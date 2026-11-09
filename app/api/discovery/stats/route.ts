import { NextRequest, NextResponse } from 'next/server';
import { getAllDiscoveryBooks, getDiscoveryCategories } from '@/lib/discovery/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const books = getAllDiscoveryBooks();
    const categories = getDiscoveryCategories();

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
        source: 'Master Unified Telegram & Digital Archive (86,337 Volumes)',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
