import { NextRequest, NextResponse } from 'next/server';
import { MultiProviderDiscovery } from '@/lib/discovery/providers/multiProvider';
import { DiscoveryStore } from '@/lib/discovery/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for multi-API discovery

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const maxPerCategory = body.maxPerCategory || 5;
    const includeTrending = body.includeTrending !== false;

    console.log(`[API /api/discovery/research] Starting multi-provider discovery...`);
    const newBooks = await MultiProviderDiscovery.runAutomatedResearch({
      maxPerCategory,
      includeTrending
    });

    // Merge with existing feed
    const existing = DiscoveryStore.loadDiscoveredBooks();
    const existingMap = new Map<string, any>();
    existing.forEach(b => existingMap.set(b.id, b));

    let addedCount = 0;
    let updatedCount = 0;

    for (const nb of newBooks) {
      if (existingMap.has(nb.id)) {
        // Update demand score & signals while preserving existing approvalStatus
        const prev = existingMap.get(nb.id);
        existingMap.set(nb.id, {
          ...nb,
          approvalStatus: prev.approvalStatus,
          targetSections: prev.targetSections?.length ? prev.targetSections : nb.targetSections
        });
        updatedCount++;
      } else {
        existingMap.set(nb.id, nb);
        addedCount++;
      }
    }

    const mergedFeed = Array.from(existingMap.values());
    DiscoveryStore.saveDiscoveredBooks(mergedFeed);

    return NextResponse.json({
      success: true,
      message: `Research complete. Added ${addedCount} new books, updated ${updatedCount} existing books.`,
      addedCount,
      updatedCount,
      totalDiscovered: mergedFeed.length,
      sampleBooks: newBooks.slice(0, 5)
    });
  } catch (err: any) {
    console.error('[API /api/discovery/research] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
