import { NextRequest, NextResponse } from 'next/server';
import { getRegistry } from '@/lib/ingestion';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const category = searchParams.get('category') || 'ALL';
    const format = searchParams.get('format') || 'ALL';
    const author = (searchParams.get('author') || '').toLowerCase().trim();
    const language = searchParams.get('language') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const sort = searchParams.get('sort') || 'featured';

    const allBooks = getRegistry();

    // STRICT: Only publish approved and published books to the public library
    let filtered = allBooks.filter(b => b.status === 'PUBLISHED' || !b.status);

    if (category !== 'ALL') {
      filtered = filtered.filter(b => b.category === category);
    }

    if (format !== 'ALL') {
      filtered = filtered.filter(b => b.format.toLowerCase().includes(format.toLowerCase()));
    }

    if (language !== 'ALL') {
      filtered = filtered.filter(b => ((b as any).language || 'en').toLowerCase() === language.toLowerCase());
    }

    if (author) {
      filtered = filtered.filter(b => b.author.toLowerCase().includes(author));
    }

    if (search) {
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        b.description.toLowerCase().includes(search) ||
        b.category.toLowerCase().includes(search)
      );
    }

    // Sorting
    if (sort === 'price_asc') {
      filtered.sort((a, b) => (a.priceInInr || 0) - (b.priceInInr || 0));
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => (b.priceInInr || 0) - (a.priceInInr || 0));
    } else if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default / featured: books with extracted covers first, then larger page counts
      filtered.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      books: paginated.map(b => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        subtitle: b.subtitle,
        author: b.author,
        publisher: b.publisher,
        priceInInr: b.priceInInr,
        originalPriceInInr: b.originalPriceInInr,
        pages: b.pages,
        format: b.format,
        fileSize: b.fileSize,
        category: b.category,
        topic: b.topic,
        badge: b.badge,
        rating: b.rating,
        coverImage: b.coverImage || (b as any).coverUrl || '/covers/standard-shelf-cover.jpg',
        coverUrl: (b as any).coverUrl || b.coverImage || '/covers/standard-shelf-cover.jpg',
        image: b.coverImage || (b as any).coverUrl || '/covers/standard-shelf-cover.jpg',
        coverStatus: (b as any).coverStatus,
        readingTime: b.readingTime,
        description: b.description,
        downloadUrl: `/api/download/${b.slug}`,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
