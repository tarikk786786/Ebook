import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getRegistry, saveRegistry } from '@/lib/ingestion';

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookIds, reason } = body;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ success: false, error: 'bookIds array is required' }, { status: 400 });
    }

    const books = getRegistry();
    const idSet = new Set(bookIds);
    let rejectedCount = 0;

    for (let i = 0; i < books.length; i++) {
      if (idSet.has(books[i].id)) {
        books[i].status = 'REJECTED';
        (books[i] as any).rightsStatus = 'REJECTED';
        (books[i] as any).rejectionReason = reason || 'Restricted or unverified copyright';
        rejectedCount++;
      }
    }

    saveRegistry(books);

    return NextResponse.json({
      success: true,
      message: `Successfully rejected ${rejectedCount} books from public catalog`,
      rejectedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
