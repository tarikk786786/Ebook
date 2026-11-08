import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getRegistry, getIngestionSources, getIngestionJobs } from '@/lib/ingestion';
import { verifyAdminAccess } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication token required' }, { status: 401 });
  }

  try {
    const books = getRegistry();
    const sources = getIngestionSources();
    const jobs = getIngestionJobs();

    const privateStorageDir = path.resolve(process.cwd(), 'private_storage');
    let physicalStorageCount = 0;
    let totalStorageBytes = 0;

    if (fs.existsSync(privateStorageDir)) {
      const files = fs.readdirSync(privateStorageDir);
      physicalStorageCount = files.length;
      for (const f of files) {
        try {
          const st = fs.statSync(path.join(privateStorageDir, f));
          totalStorageBytes += st.size;
        } catch (e) {}
      }
    }

    const publishedCount = books.filter(b => b.status === 'PUBLISHED').length;
    const pendingReviewCount = books.filter(b => b.status === 'PENDING_REVIEW' || (b as any).rightsStatus === 'PENDING_REVIEW').length;

    return NextResponse.json({
      success: true,
      service: 'Telegram -> Ebook Library Ingestion Pipeline',
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      stats: {
        totalRegisteredBooks: books.length,
        publishedBooks: publishedCount,
        pendingRightsReview: pendingReviewCount,
        physicalStorageFiles: physicalStorageCount,
        totalStorageBytes,
        totalStorageFormatted: `${(totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        connectedSources: sources.length,
        accessibleSources: sources.filter(s => s.accessStatus === 'accessible').length,
        activeJobsCount: jobs.filter(j => j.status === 'RUNNING').length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
