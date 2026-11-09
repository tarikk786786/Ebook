import { NextRequest, NextResponse } from 'next/server';
import { getBookById, getBookBySlug, Book } from '@/lib/catalog';

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid book identifier' }, { status: 400 });
    }

    const book = getBookById(id) || getBookBySlug(id);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    const baseUrl = req.headers.get('origin') ||
                    (req.headers.get('host') ? `https://${req.headers.get('host')}` : '') ||
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    'https://ebook-sandy-chi.vercel.app';

    return NextResponse.json({
      success: true,
      book: normalizeBookCover(book, baseUrl),
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
