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
    const { book, autoApprove } = body;

    if (!book || !book.title || !book.id) {
      return NextResponse.json({ success: false, error: 'Invalid book payload' }, { status: 400 });
    }

    const books = getRegistry();
    const existingIndex = books.findIndex(b => b.id === book.id || b.slug === book.slug);

    const newBook: Book = {
      ...book,
      status: autoApprove ? 'PUBLISHED' : (book.status || 'PENDING_REVIEW'),
      rightsStatus: autoApprove ? 'APPROVED' : (book.rightsStatus || 'PENDING_REVIEW'),
    };

    if (existingIndex >= 0) {
      books[existingIndex] = { ...books[existingIndex], ...newBook };
    } else {
      books.unshift(newBook);
    }

    saveRegistry(books);

    return NextResponse.json({
      success: true,
      message: `Book ${book.title} successfully ingested`,
      bookId: newBook.id,
      status: newBook.status,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
