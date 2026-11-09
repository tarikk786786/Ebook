import { NextRequest, NextResponse } from 'next/server';
import { MultiProviderDiscovery } from '@/lib/discovery/providers/multiProvider';
import { DiscoveryStore } from '@/lib/discovery/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const adminToken = req.headers.get('x-admin-token') || '';
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');

    const expectedCronSecret = process.env.CRON_SECRET || 'anontrove_cron_sec_8849b2f1e0d3c5a79b1e4f6a';
    const expectedAdminSecret = process.env.ADMIN_ACCESS_SECRET || 'anontrove_sec_9942a78f0b1e4c62d5a3b79e180d4f6a9c1e2b4d6f8a0e2';

    const isAuthorized = 
      authHeader === `Bearer ${expectedCronSecret}` ||
      adminToken === expectedAdminSecret ||
      querySecret === expectedCronSecret ||
      querySecret === expectedAdminSecret;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    console.log('[Cron Discovery] Starting scheduled automated book discovery...');
    const discovered = await MultiProviderDiscovery.runAutomatedResearch({
      maxPerCategory: 5,
      includeTrending: true
    });

    // Merge and persist
    const existing = DiscoveryStore.loadDiscoveredBooks();
    const existingMap = new Map<string, any>();
    existing.forEach(b => existingMap.set(b.id, b));

    let added = 0;
    let updated = 0;

    for (const b of discovered) {
      if (existingMap.has(b.id)) {
        const prev = existingMap.get(b.id);
        existingMap.set(b.id, {
          ...b,
          approvalStatus: prev.approvalStatus,
          targetSections: prev.targetSections?.length ? prev.targetSections : b.targetSections
        });
        updated++;
      } else {
        existingMap.set(b.id, b);
        added++;
      }
    }

    const merged = Array.from(existingMap.values());
    DiscoveryStore.saveDiscoveredBooks(merged);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: 'CRON_AUTOMATED_DISCOVERY',
      addedCount: added,
      updatedCount: updated,
      totalFeedSize: merged.length
    });
  } catch (err: any) {
    console.error('[Cron Discovery] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
