import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getRegistry, saveRegistry } from '@/lib/ingestion';
import { Book } from '@/lib/catalog';

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { books: newBooks, autoApprove } = body;

    if (!Array.isArray(newBooks) || newBooks.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or empty books array' }, { status: 400 });
    }

    const currentBooks = getRegistry();
    const bookMap = new Map(currentBooks.map(b => [b.id, b]));
    const slugMap = new Map(currentBooks.map(b => [b.slug, b]));

    let addedCount = 0;
    let updatedCount = 0;

    for (const rawBook of newBooks) {
      if (!rawBook.title || !rawBook.id) continue;

      const formatted: Book = {
        ...rawBook,
        status: autoApprove ? 'PUBLISHED' : (rawBook.status || 'PENDING_REVIEW'),
        rightsStatus: autoApprove ? 'APPROVED' : (rawBook.rightsStatus || 'PENDING_REVIEW'),
      };

      if (bookMap.has(formatted.id)) {
        const idx = currentBooks.findIndex(b => b.id === formatted.id);
        currentBooks[idx] = { ...currentBooks[idx], ...formatted };
        updatedCount++;
      } else if (slugMap.has(formatted.slug)) {
        const idx = currentBooks.findIndex(b => b.slug === formatted.slug);
        currentBooks[idx] = { ...currentBooks[idx], ...formatted };
        updatedCount++;
      } else {
        currentBooks.push(formatted);
        bookMap.set(formatted.id, formatted);
        slugMap.set(formatted.slug, formatted);
        addedCount++;
      }
    }

    saveRegistry(currentBooks);

    return NextResponse.json({
      success: true,
      message: `Bulk ingestion complete: ${addedCount} added, ${updatedCount} updated`,
      totalRegistrySize: currentBooks.length,
      added: addedCount,
      updated: updatedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
