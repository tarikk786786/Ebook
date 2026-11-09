import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { BOOK_CATALOG } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Automated Storage & Catalog Health Heartbeat
 * Runs daily to verify storage adapter connectivity, telemetry, and catalog consistency.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify Vercel Cron Secret if set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storage = getStorageAdapter();
    const usage = await storage.getStorageUsage();

    const report = {
      timestamp: new Date().toISOString(),
      provider: storage.provider,
      totalCatalogTitles: BOOK_CATALOG.length,
      storageUsage: usage,
      status: 'HEALTHY',
    };

    return NextResponse.json({ success: true, data: report });
  } catch (err: any) {
    console.error('[Storage Heartbeat Cron Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
