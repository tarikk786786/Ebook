import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminAccess } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

function getFilePath(filename: string): string {
  return path.resolve(process.cwd(), 'data', filename);
}

function loadJson<T>(filename: string, fallback: T): T {
  const filePath = getFilePath(filename);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error loading ${filename}:`, e);
    }
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const status = searchParams.get('status') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

    const demandedBooks = loadJson<any[]>('demanded_books_registry.json', []);
    const enrichedBooks = loadJson<any[]>('enriched_1000_books.json', []);
    const authorsRegistry = loadJson<Record<string, any>>('authors_registry.json', {});
    const provenanceLedger = loadJson<Record<string, any>>('cover_provenance_ledger.json', {});
    const auditLog = loadJson<any[]>('enrichment_audit_log.json', []);

    // Combine unique books
    const bookMap = new Map<string, any>();
    for (const b of [...demandedBooks, ...enrichedBooks]) {
      const id = b.id || b.slug;
      if (id && !bookMap.has(id)) {
        bookMap.set(id, b);
      }
    }

    const allBooks = Array.from(bookMap.values());

    // Compute live stats
    const totalBooks = allBooks.length;
    let verifiedCount = 0;
    let needsReviewCount = 0;
    let withIsbnCount = 0;
    let withPublisherCount = 0;
    let withAuthorBioCount = 0;
    let verifiedCoversCount = 0;

    for (const b of allBooks) {
      if (b.verificationStatus === 'VERIFIED') verifiedCount++;
      if (b.verificationStatus === 'NEEDS_REVIEW') needsReviewCount++;
      if (b.isbn || b.isbn13 || b.isbn10) withIsbnCount++;
      if (b.publisher) withPublisherCount++;
      if (b.authorProfile) withAuthorBioCount++;
      if (b.coverStatus === 'VERIFIED_AUTHENTIC' || (b.coverImage && !b.coverImage.includes('standard-shelf-cover'))) {
        verifiedCoversCount++;
      }
    }

    // Filter books
    let filtered = allBooks;
    if (status !== 'ALL') {
      filtered = filtered.filter(b => b.verificationStatus === status);
    }

    if (search) {
      filtered = filtered.filter(b =>
        (b.title && b.title.toLowerCase().includes(search)) ||
        (b.author && b.author.toLowerCase().includes(search)) ||
        (b.publisher && b.publisher.toLowerCase().includes(search)) ||
        (b.isbn && b.isbn.toLowerCase().includes(search))
      );
    }

    const totalFiltered = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedBooks = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      stats: {
        totalBooks,
        verifiedCount,
        needsReviewCount,
        withIsbnCount,
        withPublisherCount,
        withAuthorBioCount,
        verifiedCoversCount,
        totalAuthors: Object.keys(authorsRegistry).length,
        totalProvenances: Object.keys(provenanceLedger).length,
        recentAuditsCount: auditLog.length
      },
      pagination: {
        page,
        limit,
        totalItems: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit)
      },
      books: paginatedBooks,
      authors: Object.values(authorsRegistry).slice(0, 20),
      recentAudits: auditLog.slice(-10).reverse()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, bookId, status: newStatus, customData } = body;

    if (!bookId && action !== 'TRIGGER_BATCH') {
      return NextResponse.json({ success: false, error: 'bookId is required' }, { status: 400 });
    }

    const demandedPath = getFilePath('demanded_books_registry.json');
    const enrichedPath = getFilePath('enriched_1000_books.json');
    const demandedBooks = loadJson<any[]>('demanded_books_registry.json', []);
    const enrichedBooks = loadJson<any[]>('enriched_1000_books.json', []);
    const auditLog = loadJson<any[]>('enrichment_audit_log.json', []);

    let modified = false;

    const updateBookInList = (list: any[]) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === bookId || list[i].slug === bookId) {
          if (action === 'APPROVE') {
            list[i].verificationStatus = 'VERIFIED';
            list[i].confidenceScore = Math.max(85, list[i].confidenceScore || 85);
          } else if (action === 'REJECT') {
            list[i].verificationStatus = 'NEEDS_REVIEW';
          } else if (action === 'UPDATE' && customData) {
            Object.assign(list[i], customData);
          }
          modified = true;
          return list[i];
        }
      }
      return null;
    };

    const targetDemanded = updateBookInList(demandedBooks);
    const targetEnriched = updateBookInList(enrichedBooks);

    if (modified) {
      if (targetDemanded) fs.writeFileSync(demandedPath, JSON.stringify(demandedBooks, null, 2), 'utf-8');
      if (targetEnriched) fs.writeFileSync(enrichedPath, JSON.stringify(enrichedBooks, null, 2), 'utf-8');

      auditLog.push({
        timestamp: new Date().toISOString(),
        bookId,
        action,
        status: newStatus || (action === 'APPROVE' ? 'VERIFIED' : 'NEEDS_REVIEW'),
        adminOverride: true
      });
      fs.writeFileSync(getFilePath('enrichment_audit_log.json'), JSON.stringify(auditLog.slice(-500), null, 2), 'utf-8');

      return NextResponse.json({ success: true, message: `Book ${bookId} updated successfully` });
    }

    return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
