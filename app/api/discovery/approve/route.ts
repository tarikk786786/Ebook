import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryStore } from '@/lib/discovery/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids, sections } = body;

    if (ids && Array.isArray(ids)) {
      const count = DiscoveryStore.bulkApprove(ids, sections);
      return NextResponse.json({
        success: true,
        message: `Successfully approved ${count} books for storefront display.`,
        approvedCount: count
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Book id is required' }, { status: 400 });
    }

    const updated = DiscoveryStore.approveBook(id, sections);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Book not found in discovery feed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Book "${updated.title}" approved and mapped to storefront.`,
      book: updated
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
