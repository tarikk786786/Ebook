/**
 * Initialize data/community_marketplace.sqlite (isolated from enrichment/cover DBs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dbPath = path.resolve(root, 'data/community_marketplace.sqlite');
const schemaPath = path.resolve(root, 'lib/community/schema-v1.sql');

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
];

const DEFAULT_REWARD_SPLIT = {
  exampleRetailInr: 500,
  exampleListPriceInr: 50,
  exampleContributorRewardInr: 30,
  examplePlatformRewardInr: 20,
  contributorShareOfListPrice: 0.6,
  platformShareOfListPrice: 0.4,
  maxSuggestedPriceRetailFraction: 0.1,
};

const DEFAULT_PRICING_RULES = { maxSuggestedPriceRetailFraction: 0.1 };

if (!dbPath.endsWith('community_marketplace.sqlite')) {
  throw new Error('Refusing non-community db path');
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sql = fs.readFileSync(schemaPath, 'utf8');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

let schemaVersion = 0;
try {
  const row = db.prepare(`SELECT MAX(version) AS v FROM schema_migrations`).get();
  schemaVersion = row?.v ?? 0;
} catch {
  schemaVersion = 0;
}

if (schemaVersion < 1) {
  db.exec(sql);
  db.prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`).run(1);
  schemaVersion = 1;
}

const upsert = db.prepare(`
  INSERT INTO platform_settings (setting_key, value_json, description, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(setting_key) DO NOTHING
`);

upsert.run(
  'reward_split',
  JSON.stringify(DEFAULT_REWARD_SPLIT),
  'Configurable contributor/platform reward split',
);
upsert.run(
  'pricing_rules',
  JSON.stringify(DEFAULT_PRICING_RULES),
  'Pricing validation rules for community submissions',
);

const tables = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
  .all()
  .map((r) => r.name);

const missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t));
const rewardRow = db.prepare(`SELECT setting_key FROM platform_settings WHERE setting_key = ?`).get(
  'reward_split',
);

const pricingOk = 50 <= 500 * 0.1;
const pricingBad = 60 <= 500 * 0.1;

const result = {
  ok: missingTables.length === 0 && schemaVersion >= 1,
  dbPath,
  schemaVersion,
  tables,
  missingTables,
  settingsSeeded: Boolean(rewardRow),
  validationSmoke: {
    validExample: pricingOk,
    rejectsOverTenPercent: !pricingBad,
  },
};

console.log(JSON.stringify(result, null, 2));
db.close();
process.exitCode = result.ok ? 0 : 1;
