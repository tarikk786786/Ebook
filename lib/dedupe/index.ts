import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { DatabaseSync } from 'node:sqlite';

export type DedupeConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type DedupeGroupStatus = 'open' | 'approved' | 'rejected' | 'merged';

const ROOT = () => process.cwd();
const dedupeDbPath = () => path.resolve(ROOT(), 'data', 'dedupe_86k.sqlite');
const enrichmentDbPath = () => path.resolve(ROOT(), 'data', 'enrichment_86k_checkpoint.db');
const suppressionPath = () => path.resolve(ROOT(), 'data', 'catalog', 'duplicate_suppression.json');
const reportsDir = () => path.resolve(ROOT(), 'data', 'reports');

function openDedupe(readonly = true): DatabaseSync | null {
  const p = dedupeDbPath();
  if (!fs.existsSync(p)) return null;
  return new DatabaseSync(p, readonly ? { readOnly: true } : undefined);
}

function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function getDedupeSummary() {
  const db = openDedupe(true);
  const dryRun = readJsonIfExists<Record<string, unknown>>(
    path.join(reportsDir(), 'dedupe_dry_run_summary.json')
  );
  const hashSummary = readJsonIfExists<Record<string, unknown>>(
    path.join(reportsDir(), 'dedupe_hash_summary.json')
  );
  const coverSummary = readJsonIfExists<Record<string, unknown>>(
    path.join(reportsDir(), 'dedupe_cover_summary.json')
  );
  const suppression = readJsonIfExists<{
    suppressedCatalogNums?: number[];
    canonicalByDuplicate?: Record<string, number>;
    updatedAt?: number;
    policy?: string;
  }>(suppressionPath());

  let totalEbookRecords = 86260;
  try {
    if (fs.existsSync(enrichmentDbPath())) {
      const edb = new DatabaseSync(enrichmentDbPath(), { readOnly: true });
      const row = edb.prepare('SELECT COUNT(*) AS n FROM books').get() as { n: number };
      totalEbookRecords = Number(row?.n || totalEbookRecords);
      edb.close();
    }
  } catch {
    /* keep default */
  }

  if (!db) {
    return {
      totalEbookRecords,
      uniqueFileHashes: 0,
      exactDuplicateFiles: 0,
      suspectedDuplicateBooks: 0,
      duplicateMetadataGroups: 0,
      duplicateImages: 0,
      booksRequiringReview: 0,
      recordsEligibleForSafeMerge: 0,
      estimatedStorageRecoverableBytes: 0,
      mergedRecords: 0,
      openHighGroups: 0,
      dryRun,
      hashSummary,
      coverSummary,
      suppression: {
        suppressedCount: suppression?.suppressedCatalogNums?.length || 0,
        updatedAt: suppression?.updatedAt || null,
        policy: suppression?.policy || null,
      },
      message: 'dedupe_86k.sqlite not found — run a dry-run scan first',
    };
  }

  const uniqueFileHashes = Number(
    (db.prepare('SELECT COUNT(DISTINCT sha256) AS n FROM file_assets WHERE sha256 IS NOT NULL').get() as { n: number })
      ?.n || 0
  );
  const exactDuplicateFiles = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM (
             SELECT sha256 FROM file_assets WHERE sha256 IS NOT NULL
             GROUP BY sha256 HAVING COUNT(*) > 1
           )`
        )
        .get() as { n: number }
    )?.n || 0
  );

  const confCounts = db
    .prepare(
      `SELECT confidence, COUNT(*) AS n FROM duplicate_groups GROUP BY confidence`
    )
    .all() as Array<{ confidence: string; n: number }>;
  const byConf: Record<string, number> = {};
  for (const row of confCounts) byConf[row.confidence] = Number(row.n);

  const statusCounts = db
    .prepare(`SELECT status, COUNT(*) AS n FROM duplicate_groups GROUP BY status`)
    .all() as Array<{ status: string; n: number }>;
  const byStatus: Record<string, number> = {};
  for (const row of statusCounts) byStatus[row.status] = Number(row.n);

  const eligible = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM duplicate_groups
           WHERE auto_eligible=1 AND status IN ('open','approved')`
        )
        .get() as { n: number }
    )?.n || 0
  );

  const review = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM duplicate_groups
           WHERE status='open' AND (auto_eligible=0 OR confidence != 'HIGH')`
        )
        .get() as { n: number }
    )?.n || 0
  );

  const recoverable = Number(
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(estimated_recoverable_bytes),0) AS n
           FROM duplicate_groups WHERE auto_eligible=1 AND status IN ('open','approved')`
        )
        .get() as { n: number }
    )?.n || 0
  );

  const mergedRecords = Number(
    (db.prepare(`SELECT COUNT(*) AS n FROM merge_map WHERE rolled_back_at IS NULL`).get() as { n: number })
      ?.n || 0
  );

  const duplicateImages = Number(
    (
      (coverSummary?.exact_duplicate_cover_files as number | undefined) ??
      (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM (
               SELECT sha256 FROM cover_assets WHERE sha256 IS NOT NULL
               GROUP BY sha256 HAVING COUNT(*) > 1
             )`
          )
          .get() as { n: number }
      )?.n ??
      0
    )
  );

  const openHighGroups = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM duplicate_groups WHERE confidence='HIGH' AND status='open'`
        )
        .get() as { n: number }
    )?.n || 0
  );

  db.close();

  return {
    totalEbookRecords,
    uniqueFileHashes,
    exactDuplicateFiles,
    suspectedDuplicateBooks: (byConf.MEDIUM || 0) + (byConf.LOW || 0),
    duplicateMetadataGroups: byConf.HIGH || 0,
    duplicateImages,
    booksRequiringReview: review,
    recordsEligibleForSafeMerge: eligible,
    estimatedStorageRecoverableBytes: recoverable,
    mergedRecords: mergedRecords || suppression?.suppressedCatalogNums?.length || 0,
    openHighGroups,
    groupsByConfidence: byConf,
    groupsByStatus: byStatus,
    dryRun,
    hashSummary,
    coverSummary,
    suppression: {
      suppressedCount: suppression?.suppressedCatalogNums?.length || 0,
      updatedAt: suppression?.updatedAt || null,
      policy: suppression?.policy || null,
    },
  };
}

export function listDuplicateGroups(opts: {
  confidence?: string;
  status?: string;
  autoEligible?: boolean;
  limit?: number;
  offset?: number;
  q?: string;
}) {
  const db = openDedupe(true);
  if (!db) return { groups: [], total: 0 };

  const where: string[] = [];
  const params: Array<string | number> = [];
  if (opts.confidence) {
    where.push('g.confidence = ?');
    params.push(opts.confidence);
  }
  if (opts.status) {
    where.push('g.status = ?');
    params.push(opts.status);
  }
  if (opts.autoEligible === true) {
    where.push('g.auto_eligible = 1');
  } else if (opts.autoEligible === false) {
    where.push('g.auto_eligible = 0');
  }
  if (opts.q) {
    where.push(
      `EXISTS (
         SELECT 1 FROM duplicate_members m
         WHERE m.group_id = g.group_id
           AND (m.title LIKE ? OR m.author LIKE ? OR CAST(m.catalog_num AS TEXT) LIKE ? OR m.isbn13 LIKE ?)
       )`
    );
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = Number(
    (db.prepare(`SELECT COUNT(*) AS n FROM duplicate_groups g ${whereSql}`).get(...params) as { n: number })
      ?.n || 0
  );

  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const groups = db
    .prepare(
      `SELECT g.group_id, g.confidence, g.reason, g.canonical_catalog_num, g.member_count,
              g.total_bytes, g.status, g.auto_eligible, g.estimated_recoverable_bytes,
              g.created_at, g.updated_at
       FROM duplicate_groups g
       ${whereSql}
       ORDER BY
         CASE g.confidence WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
         g.auto_eligible DESC,
         g.member_count DESC,
         g.canonical_catalog_num ASC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<Record<string, unknown>>;

  const memberStmt = db.prepare(
    `SELECT group_id, catalog_num, path, sha256, title, author, file_name,
            edition, volume, isbn13, cover_url, size_bytes, is_canonical
     FROM duplicate_members WHERE group_id = ? ORDER BY is_canonical DESC, catalog_num ASC`
  );

  const enriched = groups.map((g) => {
    const members = memberStmt.all(String(g.group_id)) as Array<Record<string, unknown>>;
    return { ...g, members };
  });

  db.close();
  return { groups: enriched, total, limit, offset };
}

export function setGroupStatus(groupId: string, status: DedupeGroupStatus) {
  const db = openDedupe(false);
  if (!db) throw new Error('dedupe database missing');
  if (!['open', 'approved', 'rejected', 'merged'].includes(status)) {
    throw new Error('invalid status');
  }
  const now = Date.now() / 1000;
  const info = db
    .prepare(`UPDATE duplicate_groups SET status=?, updated_at=? WHERE group_id=?`)
    .run(status, now, groupId);
  db.prepare(
    `INSERT INTO audit_log(action, payload_json, created_at) VALUES(?,?,?)`
  ).run('set_group_status', JSON.stringify({ groupId, status }), now);
  db.close();
  return { updated: Number(info.changes || 0) };
}

export function bulkApproveAutoEligible() {
  const db = openDedupe(false);
  if (!db) throw new Error('dedupe database missing');
  const now = Date.now() / 1000;
  const info = db
    .prepare(
      `UPDATE duplicate_groups
       SET status='approved', updated_at=?
       WHERE auto_eligible=1 AND status='open'`
    )
    .run(now);
  db.prepare(
    `INSERT INTO audit_log(action, payload_json, created_at) VALUES(?,?,?)`
  ).run('bulk_approve_auto_eligible', JSON.stringify({ changes: info.changes }), now);
  db.close();
  return { approved: Number(info.changes || 0) };
}

export function listReports() {
  const names = [
    'duplicate_ebooks.csv',
    'exact_duplicate_files.csv',
    'suspected_duplicates.csv',
    'duplicate_covers.csv',
    'suspected_duplicate_covers.csv',
    'merged_records.csv',
    'removed_files.csv',
    'unresolved_duplicates.csv',
    'dedupe_dry_run_summary.json',
    'dedupe_hash_summary.json',
    'dedupe_cover_summary.json',
  ];
  return names.map((name) => {
    const p = path.join(reportsDir(), name);
    const exists = fs.existsSync(p);
    return {
      name,
      path: exists ? `data/reports/${name}` : null,
      exists,
      sizeBytes: exists ? fs.statSync(p).size : 0,
    };
  });
}

export function readReportFile(name: string): { content: string; contentType: string } | null {
  const safe = path.basename(name);
  const allowed = new Set([
    'duplicate_ebooks.csv',
    'exact_duplicate_files.csv',
    'suspected_duplicates.csv',
    'duplicate_covers.csv',
    'suspected_duplicate_covers.csv',
    'merged_records.csv',
    'removed_files.csv',
    'unresolved_duplicates.csv',
    'dedupe_dry_run_summary.json',
    'dedupe_hash_summary.json',
    'dedupe_cover_summary.json',
  ]);
  if (!allowed.has(safe)) return null;
  const p = path.join(reportsDir(), safe);
  if (!fs.existsSync(p)) return null;
  const content = fs.readFileSync(p, 'utf8');
  return {
    content,
    contentType: safe.endsWith('.json') ? 'application/json' : 'text/csv',
  };
}

export function runDedupeScript(args: string[]): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const script = path.resolve(ROOT(), 'scripts', 'dedupe_detect_and_remove.py');
    const child = spawn('python', [script, ...args], {
      cwd: ROOT(),
      env: process.env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += String(d);
      if (stdout.length > 200_000) stdout = stdout.slice(-200_000);
    });
    child.stderr.on('data', (d) => {
      stderr += String(d);
      if (stderr.length > 100_000) stderr = stderr.slice(-100_000);
    });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (err) => resolve({ code: 1, stdout, stderr: String(err) }));
  });
}
