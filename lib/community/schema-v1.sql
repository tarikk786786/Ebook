PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contributors (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  display_name TEXT,
  upi_id TEXT,
  upi_verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  access_token_hash TEXT,
  access_token_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS ebook_submissions (
  submission_id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  isbn13 TEXT,
  isbn10 TEXT,
  description TEXT,
  category TEXT,
  retail_price_inr REAL,
  suggested_price_inr REAL,
  license_type TEXT,
  source_url TEXT,
  proof_storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'submitted', 'under_review', 'license_pending',
      'approved', 'rejected', 'published'
    )),
  admin_notes TEXT,
  published_catalog_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ebook_licenses (
  license_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  platform TEXT,
  commercial_ok INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT,
  last_checked_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'needs_review')),
  reviewer_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (submission_id) REFERENCES ebook_submissions(submission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ebook_sources (
  source_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT,
  reachability_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (reachability_status IN ('unknown', 'reachable', 'unreachable', 'blocked')),
  metadata_json TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (submission_id) REFERENCES ebook_submissions(submission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ebook_requests (
  request_id TEXT PRIMARY KEY,
  requester_email TEXT NOT NULL COLLATE NOCASE,
  title TEXT NOT NULL,
  author TEXT,
  isbn13 TEXT,
  isbn10 TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'fulfilled', 'duplicate', 'closed')),
  upvote_count INTEGER NOT NULL DEFAULT 0,
  duplicate_of TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (duplicate_of) REFERENCES ebook_requests(request_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS request_upvotes (
  upvote_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (request_id, voter_key),
  FOREIGN KEY (request_id) REFERENCES ebook_requests(request_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contributor_earnings (
  earning_id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  amount_inr REAL NOT NULL CHECK (amount_inr >= 0),
  order_id TEXT,
  book_id TEXT,
  submission_id TEXT,
  reason TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES ebook_submissions(submission_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payout_requests (
  payout_request_id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL,
  amount_inr REAL NOT NULL CHECK (amount_inr > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  upi_id TEXT NOT NULL,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payout_transactions (
  transaction_id TEXT PRIMARY KEY,
  payout_request_id TEXT NOT NULL,
  amount_inr REAL NOT NULL CHECK (amount_inr > 0),
  admin_ref TEXT,
  paid_at TEXT,
  recorded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(payout_request_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  recipient_type TEXT NOT NULL
    CHECK (recipient_type IN ('contributor', 'requester', 'admin')),
  recipient_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  subject TEXT,
  body TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contributors_email ON contributors(email);
CREATE INDEX IF NOT EXISTS idx_contributors_token_hash ON contributors(access_token_hash);

CREATE INDEX IF NOT EXISTS idx_submissions_contributor ON ebook_submissions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON ebook_submissions(status);

CREATE INDEX IF NOT EXISTS idx_requests_status ON ebook_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_email ON ebook_requests(requester_email);

CREATE INDEX IF NOT EXISTS idx_earnings_contributor ON contributor_earnings(contributor_id);
CREATE INDEX IF NOT EXISTS idx_earnings_order_book ON contributor_earnings(order_id, book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_earnings_order_book_reason
  ON contributor_earnings(order_id, book_id, reason)
  WHERE order_id IS NOT NULL AND book_id IS NOT NULL AND reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payout_requests_contributor ON payout_requests(contributor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_key);
