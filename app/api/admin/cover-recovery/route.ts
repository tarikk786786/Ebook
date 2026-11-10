import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { googleBooksKeyConfigured } from '@/lib/cover-recovery';

export const dynamic = 'force-dynamic';

function coversDbPath(): string {
  return path.resolve(process.cwd(), 'data', 'covers_86k.sqlite');
}

function readAudit(): Record<string, unknown> | null {
  const p = path.resolve(process.cwd(), 'data', 'reports', 'cover_recovery_phase1_audit.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  const dbFile = coversDbPath();
  if (!fs.existsSync(dbFile)) {
    return NextResponse.json({
      success: true,
      googleBooksKeyConfigured: googleBooksKeyConfigured(),
      stats: {
        total: 0,
        found: 0,
        pending: 0,
        notFound: 0,
        review: 0,
        progressPct: 0,
      },
      bySource: {},
      recent: [],
      audit: readAudit(),
      message: 'covers_86k.sqlite not found yet — run scripts/fetch_all_86k_covers.py',
    });
  }

  try {
    const db = new DatabaseSync(dbFile, { readOnly: true });
    const statusRows = db.prepare('SELECT status, COUNT(*) AS n FROM covers GROUP BY status').all() as Array<{
      status: string;
      n: number;
    }>;
    const byStatus: Record<string, number> = {};
    for (const row of statusRows) byStatus[row.status] = Number(row.n);

    const sourceRows = db
      .prepare(
        "SELECT coalesce(source,'(none)') AS source, COUNT(*) AS n FROM covers WHERE status='found' GROUP BY source ORDER BY n DESC"
      )
      .all() as Array<{ source: string; n: number }>;
    const bySource: Record<string, number> = {};
    for (const row of sourceRows) bySource[row.source] = Number(row.n);

    const recent = db
      .prepare(
        `SELECT catalog_num, slug, title, author, status, source, cover_url, updated_at
         FROM covers
         WHERE status='found'
         ORDER BY updated_at DESC
         LIMIT 25`
      )
      .all();

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const found = byStatus.found || 0;
    const pending = byStatus.pending || 0;
    const notFound = byStatus.not_found || 0;
    const review = byStatus.review || 0;
    const progressPct = total > 0 ? Math.round(((found + notFound) / total) * 1000) / 10 : 0;

    db.close();

    return NextResponse.json({
      success: true,
      googleBooksKeyConfigured: googleBooksKeyConfigured(),
      stats: {
        total,
        found,
        pending,
        notFound,
        review,
        progressPct,
        missing: pending + notFound,
      },
      bySource,
      recent,
      audit: readAudit(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to read cover recovery DB' },
      { status: 500 }
    );
  }
}
