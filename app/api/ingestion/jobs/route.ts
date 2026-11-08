import { NextRequest, NextResponse } from 'next/server';
import { getIngestionJobs } from '@/lib/ingestion';
import { verifyAdminAccess } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const jobs = getIngestionJobs();
    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
