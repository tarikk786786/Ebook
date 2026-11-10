import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getAiConfigStatus, getAiTableCounts } from '@/lib/ai-book-service';
import curatedPdf from '@/data/catalog/curated_masterclasses_from_pdf.json';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let directoryCount = 0;
  let directoryCoverMatched = 0;
  try {
    const dirPath = path.resolve(process.cwd(), 'data', 'catalog', 'directory_86k_from_pdf.json');
    if (fs.existsSync(dirPath)) {
      const payload = JSON.parse(fs.readFileSync(dirPath, 'utf8'));
      directoryCount = Number(payload.count || (payload.books || []).length || 0);
      directoryCoverMatched = Number(
        payload.coverMatched ??
          (payload.books || []).filter((b: any) => b.coverVerified).length
      );
    }
  } catch {
    // ignore overlay read errors
  }

  const curated = curatedPdf as any;

  return NextResponse.json({
    config: getAiConfigStatus(),
    counts: getAiTableCounts(),
    catalogPdf: {
      curatedCount: Number(curated.count || (curated.books || []).length || 0),
      curatedCoverMatched: Number(curated.coverMatched || 0),
      directoryCount,
      directoryCoverMatched,
    },
  });
}
