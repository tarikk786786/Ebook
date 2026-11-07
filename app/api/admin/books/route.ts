import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getBookCatalog, Book, INITIAL_BOOK_CATALOG } from '@/lib/catalog';
import { verifyAdminAccess } from '@/lib/auth/admin';

function getRegistryFilePath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'books_registry.json');
}

function loadRegistry(): Book[] {
  const filePath = getRegistryFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error reading books_registry.json:', e);
    }
  }
  // Initialize with initial catalog
  saveRegistry(INITIAL_BOOK_CATALOG);
  return INITIAL_BOOK_CATALOG;
}

function saveRegistry(books: Book[]) {
  const filePath = getRegistryFilePath();
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || 'ALL';

    let books = loadRegistry();

    if (status !== 'ALL') {
      books = books.filter(b => b.status === status);
    }

    if (category !== 'ALL') {
      books = books.filter(b => b.category === category);
    }

    if (search) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(search)) ||
        (b.sourceTelegram && b.sourceTelegram.toLowerCase().includes(search)) ||
        b.fileName.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: books.length,
      books
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, bookId, bookIds, updates } = body;

    const books = loadRegistry();

    if (action === 'TOGGLE_STATUS' && bookId) {
      const book = books.find(b => b.id === bookId);
      if (!book) {
        return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
      }
      book.status = book.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      saveRegistry(books);
      return NextResponse.json({ success: true, updatedBook: book });
    }

    if (action === 'BULK_SET_STATUS' && Array.isArray(bookIds)) {
      const targetStatus = updates?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
      let modified = 0;
      for (const b of books) {
        if (bookIds.includes(b.id)) {
          b.status = targetStatus;
          modified++;
        }
      }
      saveRegistry(books);
      return NextResponse.json({ success: true, modifiedCount: modified });
    }

    if (action === 'UPDATE_BOOK' && bookId && updates) {
      const bookIndex = books.findIndex(b => b.id === bookId);
      if (bookIndex === -1) {
        return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
      }
      books[bookIndex] = { ...books[bookIndex], ...updates };
      saveRegistry(books);
      return NextResponse.json({ success: true, updatedBook: books[bookIndex] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
