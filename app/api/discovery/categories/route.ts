import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryCategories } from '@/lib/discovery/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const categories = getDiscoveryCategories();
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
