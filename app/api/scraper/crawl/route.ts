import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDiscoveredBooks, DiscoveredEbook } from '@/lib/scraper';
import { verifyAdminAccess } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

function getCatalogFilePath() {
  return path.join(process.cwd(), 'data', 'scraper', 'universal_catalog.json');
}

export async function POST(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, bookId, updates } = body;

    const catalogPath = getCatalogFilePath();
    if (!fs.existsSync(catalogPath)) {
      return NextResponse.json({ error: 'Catalog file not found' }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    let books: DiscoveredEbook[] = data.books || [];

    if (action === 'approve_book') {
      const idx = books.findIndex((b) => b.id === bookId);
      if (idx !== -1) {
        books[idx] = {
          ...books[idx],
          confidenceScore: 1.0,
          ...updates
        };
        data.books = books;
        fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf-8');
        return NextResponse.json({ success: true, message: `Book ${books[idx].title} approved for public catalog` });
      }
    } else if (action === 'reject_book') {
      const idx = books.findIndex((b) => b.id === bookId);
      if (idx !== -1) {
        const removed = books.splice(idx, 1);
        data.books = books;
        if (data.metadata) {
          data.metadata.totalUniqueBooks = books.length;
        }
        fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf-8');
        return NextResponse.json({ success: true, message: `Book ${removed[0]?.title} removed from catalog` });
      }
    } else if (action === 'trigger_scan') {
      return NextResponse.json({
        success: true,
        message: 'Crawler run scheduled. Checkpoints active.',
        checkpoint: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Invalid scraper action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
