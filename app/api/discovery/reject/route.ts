import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryStore } from '@/lib/discovery/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    if (ids && Array.isArray(ids)) {
      const count = DiscoveryStore.bulkReject(ids);
      return NextResponse.json({
        success: true,
        message: `Successfully rejected ${count} books from feed.`,
        rejectedCount: count
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Book id is required' }, { status: 400 });
    }

    const ok = DiscoveryStore.rejectBook(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Book rejected and removed from storefront.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
