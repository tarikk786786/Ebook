import { NextRequest, NextResponse } from 'next/server';
import { getBookCatalog, Book } from '@/lib/catalog';
import { AUTHORITATIVE_CATEGORIES } from '@/lib/categories';

export const dynamic = 'force-dynamic';

function normalizeBookCover(book: Book, baseUrl: string) {
  const rawCover = book.coverImage || (book as any).coverUrl || `/api/covers/${book.slug}`;
  const hasCover = !rawCover.includes('standard-shelf-cover') && !rawCover.startsWith('/api/covers/');
  const absoluteCover = rawCover.startsWith('http')
    ? rawCover
    : `${baseUrl}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;

  return {
    ...book,
    coverImage: rawCover,
    coverUrl: rawCover,
    image: rawCover,
    coverAbsoluteUrl: absoluteCover,
    hasCover,
    coverStatus: book.coverStatus || (hasCover ? 'linked' : 'pending'),
  };
}

function matchesCollection(book: Book, collection: string): boolean {
  const category = (book.category || '').toLowerCase();
  const tags = (book.tags || []).map((tag) => tag.toLowerCase());
  switch (collection) {
    case 'LATEST_2026': return Boolean(book.isLatest);
    case 'HINDI': return book.language === 'hi' || tags.includes('hindi') || category.includes('hindi') || /[\u0900-\u097F]/.test(book.title);
    case 'BUSINESS': return ['business', 'startup', 'finance', 'management'].some((word) => category.includes(word)) || tags.some((tag) => ['business', 'startup', 'finance'].includes(tag));
    case 'CLASSIC_ARCHIVE': return Boolean(book.isClassicArchive) || book.collection === 'CLASSIC_ARCHIVE';
    case 'DEALS_29': return book.priceInInr <= 29;
    case 'BOOKS': return ['published_ebook', 'textbook', 'professional_book'].includes(book.primaryResourceType || '') || Boolean(book.isLatest);
    case 'NOTES': return ['study_notes', 'lecture_notes', 'exam_preparation'].includes(book.primaryResourceType || '') || category.includes('notes');
    case 'CODE': return ['code_template', 'template'].includes(book.primaryResourceType || '');
    default: return true;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();
    const category = searchParams.get('category') || 'ALL';
    const collection = searchParams.get('collection') || 'ALL';
    const priceTier = searchParams.get('priceTier') || 'ALL';
    const sort = searchParams.get('sort') || 'featured';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || searchParams.get('pageSize') || '24', 10)));

    const baseUrl = req.headers.get('origin') ||
      (req.headers.get('host') ? `https://${req.headers.get('host')}` : '') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://ebook-sandy-chi.vercel.app';

    let books = getBookCatalog().filter((book) => book.status === 'PUBLISHED' || !book.status);

    if (category !== 'ALL' && category !== 'All') {
      const definition = AUTHORITATIVE_CATEGORIES.find((item) => item.name.toLowerCase() === category.toLowerCase());
      const allowed = new Set((definition?.matchedCatalogCategories || [category]).map((value) => value.toLowerCase()));
      books = books.filter((book) => allowed.has((book.category || '').toLowerCase()) || (book.category || '').toLowerCase() === category.toLowerCase());
    }

    if (collection !== 'ALL') books = books.filter((book) => matchesCollection(book, collection));

    if (priceTier === '29' || priceTier === 'UNDER_49' || priceTier === 'UNDER_99' || priceTier === 'PREMIUM') {
      books = books.filter((book) => {
        if (priceTier === '29') return book.priceInInr <= 29;
        if (priceTier === 'UNDER_49') return book.priceInInr <= 49;
        if (priceTier === 'UNDER_99') return book.priceInInr <= 99;
        return book.priceInInr >= 100;
      });
    }

    if (search) {
      books = books.filter((book) =>
        (book.title || '').toLowerCase().includes(search) ||
        (book.author || '').toLowerCase().includes(search) ||
        (book.subtitle || '').toLowerCase().includes(search) ||
        (book.description || '').toLowerCase().includes(search) ||
        (book.category || '').toLowerCase().includes(search) ||
        (Array.isArray(book.tags) && book.tags.some((tag) => tag.toLowerCase().includes(search)))
      );
    }

    if (sort === 'price_asc') books.sort((a, b) => a.priceInInr - b.priceInInr);
    else if (sort === 'price_desc') books.sort((a, b) => b.priceInInr - a.priceInInr);
    else if (sort === 'rating') books.sort((a, b) => b.rating - a.rating);
    else if (sort === 'title') books.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'year') books.sort((a, b) => parseInt(b.publicationYear || '0', 10) - parseInt(a.publicationYear || '0', 10));

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
      books: paginated.map((book) => normalizeBookCover(book, baseUrl)),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Books API error:', err);
    return NextResponse.json({ success: false, error: 'Unable to load the catalogue right now.' }, { status: 500 });
  }
}
