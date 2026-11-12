import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

/** Isolated community DB filename — never enrichment or cover DBs. */
export const COMMUNITY_DB_FILENAME = 'community_marketplace.sqlite';

const FORBIDDEN_DB_MARKERS = [
  'enrichment_86k_checkpoint',
  'covers_86k',
  'enrichment',
  'cover',
] as const;

export function communityMarketplaceDbPath(): string {
  return path.resolve(process.cwd(), 'data', COMMUNITY_DB_FILENAME);
}

/**
 * Fail closed if something points at a non-community SQLite file.
 */
export function assertSafeCommunityDbPath(resolvedPath: string): void {
  const base = path.basename(resolvedPath).toLowerCase();
  if (base !== COMMUNITY_DB_FILENAME.toLowerCase()) {
    throw new Error(
      `[community/db] Refusing to open "${base}" — expected only ${COMMUNITY_DB_FILENAME}.`,
    );
  }
  const normalized = resolvedPath.replace(/\\/g, '/').toLowerCase();
  for (const marker of FORBIDDEN_DB_MARKERS) {
    if (normalized.includes(marker) && !normalized.includes('community_marketplace')) {
      throw new Error(
        `[community/db] Refusing path that looks like enrichment/cover DB: ${resolvedPath}`,
      );
    }
  }
}

export function ensureCommunityDataDir(): void {
  const dir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export type OpenCommunityDbOptions = {
  readOnly?: boolean;
};

/**
 * Opens `data/community_marketplace.sqlite` only. Does not touch other databases.
 */
export function openCommunityDatabase(options: OpenCommunityDbOptions = {}): DatabaseSync {
  const dbPath = communityMarketplaceDbPath();
  assertSafeCommunityDbPath(dbPath);
  ensureCommunityDataDir();

  const openOptions = options.readOnly ? { readOnly: true as const } : undefined;
  return new DatabaseSync(dbPath, openOptions);
}

export function listCommunityTableNames(db: DatabaseSync): string[] {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}
