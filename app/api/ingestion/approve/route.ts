import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getRegistry, saveRegistry } from '@/lib/ingestion';

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookIds, licenseType } = body;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ success: false, error: 'bookIds array is required' }, { status: 400 });
    }

    const books = getRegistry();
    const idSet = new Set(bookIds);
    let approvedCount = 0;

    for (let i = 0; i < books.length; i++) {
      if (idSet.has(books[i].id)) {
        books[i].status = 'PUBLISHED';
        (books[i] as any).rightsStatus = 'APPROVED';
        (books[i] as any).license = licenseType || 'Public Domain / Open Educational Access';
        approvedCount++;
      }
    }

    saveRegistry(books);

    return NextResponse.json({
      success: true,
      message: `Successfully approved and published ${approvedCount} books`,
      approvedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
