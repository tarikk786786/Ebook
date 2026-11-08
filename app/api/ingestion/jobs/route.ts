import { NextRequest, NextResponse } from 'next/server';
import { getIngestionJobs } from '@/lib/ingestion';

export async function GET(req: NextRequest) {
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
