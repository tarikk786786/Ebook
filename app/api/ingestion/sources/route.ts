import { NextRequest, NextResponse } from 'next/server';
import { getIngestionSources } from '@/lib/ingestion';

export async function GET(req: NextRequest) {
  try {
    const sources = getIngestionSources();
    return NextResponse.json({
      success: true,
      sources,
      total: sources.length,
      accessible: sources.filter(s => s.accessStatus === 'accessible').length,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
