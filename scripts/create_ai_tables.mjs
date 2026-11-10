/**
 * Create AI intelligence tables on enrichment_86k_checkpoint.db
 * Uses Node.js built-in node:sqlite (DatabaseSync).
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/enrichment_86k_checkpoint.db');

const db = new DatabaseSync(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  book_id TEXT,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload_json TEXT,
  result_json TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_cover_candidates (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  source TEXT NOT NULL,
  image_url TEXT,
  local_path TEXT,
  confidence REAL DEFAULT 0,
  verified INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_usage_ledger (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_cover_book ON ai_cover_candidates(book_id);
`);

const counts = {
  ai_jobs: db.prepare('SELECT COUNT(*) AS c FROM ai_jobs').get().c,
  ai_cover_candidates: db.prepare('SELECT COUNT(*) AS c FROM ai_cover_candidates').get().c,
  ai_usage_ledger: db.prepare('SELECT COUNT(*) AS c FROM ai_usage_ledger').get().c,
};

console.log(JSON.stringify({ ok: true, dbPath, counts }, null, 2));
db.close();
