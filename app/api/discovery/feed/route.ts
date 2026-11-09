import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryStore } from '@/lib/discovery/store';
import type { DemandGrade, ApprovalStatus, StorefrontSection } from '@/lib/discovery/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const grade = searchParams.get('grade') as (DemandGrade | 'ALL') | null;
    const approvalStatus = searchParams.get('approvalStatus') as (ApprovalStatus | 'ALL') | null;
    const section = searchParams.get('section') as (StorefrontSection | 'ALL') | null;
    const query = searchParams.get('q')?.toLowerCase();
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!, 10) : 0;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    let books = DiscoveryStore.loadDiscoveredBooks();

    // If feed is empty, seed with initial automated research or fallback items
    if (books.length === 0) {
      const stats = DiscoveryStore.getDiscoveryStats();
      if (stats.totalDiscovered === 0) {
        // Trigger synchronous quick seed in background
      }
    }

    if (category && category !== 'ALL') {
      books = books.filter(b => b.categorySlug === category || b.category.toLowerCase() === category.toLowerCase());
    }

    if (grade && grade !== 'ALL') {
      books = books.filter(b => b.demandGrade === grade);
    }

    if (approvalStatus && approvalStatus !== 'ALL') {
      books = books.filter(b => b.approvalStatus === approvalStatus);
    }

    if (section && section !== 'ALL') {
      books = books.filter(b => b.targetSections && b.targetSections.includes(section));
    }

    if (query) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query) ||
        (b.isbn13 && b.isbn13.includes(query))
      );
    }

    if (minScore > 0) {
      books = books.filter(b => (b.demandScore ?? 0) >= minScore);
    }

    // Default sorting: highest demandScore first
    books.sort((a, b) => (b.demandScore ?? 0) - (a.demandScore ?? 0));

    const total = books.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = books.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      books: paginated
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
