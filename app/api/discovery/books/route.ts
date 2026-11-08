import { NextRequest, NextResponse } from 'next/server';
import { filterDiscoveryBooks } from '@/lib/discovery/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categorySlug = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as any) || 'ALL';
    const sortBy = (searchParams.get('sort') as any) || 'REF_ASC';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '30', 10);
    const hasIsbn = searchParams.get('hasIsbn') === 'true';
    const hasCover = searchParams.get('hasCover') === 'true';

    const result = filterDiscoveryBooks({
      query,
      categorySlug,
      status,
      sortBy,
      page,
      pageSize,
      hasIsbn,
      hasCover,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
