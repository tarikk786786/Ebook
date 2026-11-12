import fs from 'fs';
import type { DatabaseSync } from 'node:sqlite';
import {
  communityMarketplaceDbPath,
  assertSafeCommunityDbPath,
  listCommunityTableNames,
  openCommunityDatabase,
} from './db';
import { getAppliedSchemaVersion, runCommunityMigrations } from './migrate';
import {
  DEFAULT_PRICING_RULES,
  DEFAULT_PAYOUT_RULES,
  DEFAULT_REWARD_SPLIT_SETTINGS,
  PLATFORM_SETTING_PRICING_RULES,
  PLATFORM_SETTING_PAYOUT_RULES,
  PLATFORM_SETTING_REWARD_SPLIT,
} from './validation';
import { COMMUNITY_SCHEMA_VERSION } from './types';

const REQUIRED_TABLES = [
  'contributors',
  'ebook_submissions',
  'ebook_licenses',
  'ebook_sources',
  'ebook_requests',
  'request_upvotes',
  'contributor_earnings',
  'payout_requests',
  'payout_transactions',
  'notifications',
  'audit_logs',
  'platform_settings',
  'schema_migrations',
] as const;

function seedDefaultPlatformSettings(db: DatabaseSync): void {
  const upsert = db.prepare(`
    INSERT INTO platform_settings (setting_key, value_json, description, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(setting_key) DO NOTHING
  `);

  upsert.run(
    PLATFORM_SETTING_REWARD_SPLIT,
    JSON.stringify(DEFAULT_REWARD_SPLIT_SETTINGS),
    'Configurable contributor/platform reward split (example amounts + share of list price)',
  );

  upsert.run(
    PLATFORM_SETTING_PRICING_RULES,
    JSON.stringify(DEFAULT_PRICING_RULES),
    'Pricing validation rules for community submissions',
  );

  upsert.run(
    PLATFORM_SETTING_PAYOUT_RULES,
    JSON.stringify(DEFAULT_PAYOUT_RULES),
    'Manual UPI payout thresholds and rules',
  );
}

export interface CommunityInitResult {
  ok: boolean;
  dbPath: string;
  schemaVersion: number;
  tables: string[];
  missingTables: string[];
  settingsSeeded: boolean;
}

/**
 * Creates/migrates `data/community_marketplace.sqlite` only. Never opens enrichment or cover DBs.
 */
export function initCommunityMarketplaceDatabase(): CommunityInitResult {
  const dbPath = communityMarketplaceDbPath();
  assertSafeCommunityDbPath(dbPath);

  const db = openCommunityDatabase();
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    const schemaVersion = runCommunityMigrations(db);
    seedDefaultPlatformSettings(db);

    const tables = listCommunityTableNames(db);
    const missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t));

    const rewardRow = db
      .prepare(`SELECT setting_key FROM platform_settings WHERE setting_key = ?`)
      .get(PLATFORM_SETTING_REWARD_SPLIT);

    return {
      ok: missingTables.length === 0 && schemaVersion >= COMMUNITY_SCHEMA_VERSION,
      dbPath,
      schemaVersion,
      tables,
      missingTables,
      settingsSeeded: Boolean(rewardRow),
    };
  } finally {
    db.close();
  }
}

export function getCommunitySchemaStatus(): CommunityInitResult {
  const dbPath = communityMarketplaceDbPath();
  assertSafeCommunityDbPath(dbPath);

  if (!fs.existsSync(dbPath)) {
    return {
      ok: false,
      dbPath,
      schemaVersion: 0,
      tables: [],
      missingTables: [...REQUIRED_TABLES],
      settingsSeeded: false,
    };
  }

  const db = openCommunityDatabase({ readOnly: true });
  try {
    const schemaVersion = getAppliedSchemaVersion(db);
    const tables = listCommunityTableNames(db);
    const missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t));
    const rewardRow = db
      .prepare(`SELECT setting_key FROM platform_settings WHERE setting_key = ?`)
      .get(PLATFORM_SETTING_REWARD_SPLIT);

    return {
      ok: missingTables.length === 0 && schemaVersion >= COMMUNITY_SCHEMA_VERSION,
      dbPath,
      schemaVersion,
      tables,
      missingTables,
      settingsSeeded: Boolean(rewardRow),
    };
  } finally {
    db.close();
  }
}
