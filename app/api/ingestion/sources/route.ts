import { NextRequest, NextResponse } from 'next/server';
import { getIngestionSources } from '@/lib/ingestion';
import { verifyAdminAccess } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

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
