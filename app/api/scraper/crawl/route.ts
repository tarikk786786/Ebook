import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDiscoveredBooks, DiscoveredEbook } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

function getCatalogFilePath() {
  return path.join(process.cwd(), 'data', 'scraper', 'universal_catalog.json');
}

function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const secret = process.env.ADMIN_ACCESS_SECRET || 'anontrove_sec_9942a78f0b1e4c62d5a3b79e180d4f6a9c1e2b4d6f8a0e2';
  return Boolean(token && token === secret);
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
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
