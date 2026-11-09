import { NextRequest, NextResponse } from 'next/server';
import { BOOK_CATALOG, Book } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

function getFallbackCover(): string {
  return '/covers/standard-shelf-cover.jpg';
}

function normalizeBookCover(book: Book, baseUrl: string) {
  const rawCover = book.coverImage || (book as any).coverUrl || getFallbackCover();
  const absoluteCover = rawCover.startsWith('http')
    ? rawCover
    : `${baseUrl}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;

  return {
    ...book,
    coverImage: rawCover,
    coverUrl: rawCover,
    image: rawCover,
    coverAbsoluteUrl: absoluteCover,
    hasCover: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();
    const category = searchParams.get('category') || 'ALL';
    const collection = searchParams.get('collection') || 'ALL';
    const sort = searchParams.get('sort') || 'featured';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '24', 10)));

    const baseUrl = req.headers.get('origin') ||
                    (req.headers.get('host') ? `https://${req.headers.get('host')}` : '') ||
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    'https://ebook-sandy-chi.vercel.app';

    let books = BOOK_CATALOG.filter(b => b.status === 'PUBLISHED' || !b.status);

    if (category !== 'ALL' && category !== 'All') {
      const catLower = category.toLowerCase();
      books = books.filter(b => b.category?.toLowerCase() === catLower);
    }

    if (collection !== 'ALL') {
      books = books.filter(b => b.collection === collection);
    }

    if (search) {
      books = books.filter(b =>
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(search)) ||
        (b.category && b.category.toLowerCase().includes(search)) ||
        (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    // Sorting
    if (sort === 'price_asc') {
      books.sort((a, b) => (a.priceInInr || 0) - (b.priceInInr || 0));
    } else if (sort === 'price_desc') {
      books.sort((a, b) => (b.priceInInr || 0) - (a.priceInInr || 0));
    } else if (sort === 'rating') {
      books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'title') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'year') {
      books.sort((a, b) => parseInt(b.publicationYear || '0', 10) - parseInt(a.publicationYear || '0', 10));
    }

    const total = books.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = books.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      books: paginated.map(b => normalizeBookCover(b, baseUrl)),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
