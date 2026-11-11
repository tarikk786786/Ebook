import fs from 'fs';
import path from 'path';
import type { DatabaseSync } from 'node:sqlite';
import { COMMUNITY_SCHEMA_VERSION } from './types';

function loadMigrationV1Sql(): string {
  const sqlPath = path.resolve(process.cwd(), 'lib/community/schema-v1.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`[community/migrate] Missing schema file: ${sqlPath}`);
  }
  return fs.readFileSync(sqlPath, 'utf8');
}

let cachedSql: string | null = null;

export function getMigrationV1Sql(): string {
  if (!cachedSql) {
    cachedSql = loadMigrationV1Sql();
  }
  return cachedSql;
}

export function getAppliedSchemaVersion(db: DatabaseSync): number {
  try {
    const row = db
      .prepare(`SELECT MAX(version) AS v FROM schema_migrations`)
      .get() as { v: number | null };
    return row?.v ?? 0;
  } catch {
    return 0;
  }
}

export function runCommunityMigrations(db: DatabaseSync): number {
  const current = getAppliedSchemaVersion(db);
  if (current >= COMMUNITY_SCHEMA_VERSION) {
    return current;
  }

  if (current < 1) {
    db.exec(getMigrationV1Sql());
    db.prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`).run(1);
  }

  if (current < 2) {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_earnings_order_book_reason
        ON contributor_earnings(order_id, book_id, reason)
        WHERE order_id IS NOT NULL AND book_id IS NOT NULL AND reason IS NOT NULL;
    `);
    db.prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`).run(2);
  }

  return getAppliedSchemaVersion(db);
}
