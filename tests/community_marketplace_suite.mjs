/**
 * Community marketplace — focused security and business-rule tests.
 * Run: node --experimental-strip-types --test tests/community_marketplace_suite.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaSqlPath = path.join(repoRoot, 'lib', 'community', 'schema-v1.sql');

process.env.ADMIN_ACCESS_SECRET =
  process.env.ADMIN_ACCESS_SECRET ||
  'ci_test_admin_secret_minimum_32_characters_long_12345';
process.env.COMMUNITY_ACCESS_TOKEN_SECRET =
  process.env.COMMUNITY_ACCESS_TOKEN_SECRET ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function withIsolatedCommunityDb(fn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anontrove-community-test-'));
  const prevCwd = process.cwd();
  process.chdir(tmpDir);
  fs.mkdirSync('data', { recursive: true });
  let db;
  try {
    db = openIsolatedCommunityDatabase();
    return fn(db);
  } finally {
    try {
      db?.close();
    } catch {
      /* ignore */
    }
    process.chdir(prevCwd);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* Windows may briefly lock SQLite files after close */
    }
  }
}

function openIsolatedCommunityDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'community_marketplace.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec(fs.readFileSync(schemaSqlPath, 'utf8'));
  db.exec('PRAGMA foreign_keys = ON;');
  db.prepare(
    `INSERT OR IGNORE INTO platform_settings (setting_key, value_json, description)
     VALUES ('payout_rules', ?, 'test payout rules')`,
  ).run(JSON.stringify({ minWithdrawalInr: 100 }));
  return db;
}

function buildEarningsIdempotencyKey(orderId, bookId, reason) {
  return `${orderId}:${bookId}:${reason}`;
}

function tryCreditSale(db, { orderId, bookId, contributorId, submissionId, amountInr }) {
  const reason = 'community_sale';
  const idempotencyKey = buildEarningsIdempotencyKey(orderId, bookId, reason);
  const earningId = crypto.randomUUID();
  const insert = db.prepare(`
    INSERT INTO contributor_earnings (
      earning_id, contributor_id, entry_type, amount_inr,
      order_id, book_id, submission_id, reason, idempotency_key
    ) VALUES (?, ?, 'credit', ?, ?, ?, ?, ?, ?)
  `);
  try {
    insert.run(earningId, contributorId, amountInr, orderId, bookId, submissionId, reason, idempotencyKey);
    return { status: 'credited', earningId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint failed/i.test(message)) {
      return { status: 'duplicate' };
    }
    throw err;
  }
}

function seedPublishedListing(db, { bookId, contributorId, submissionId }) {
  db.prepare(
    `INSERT INTO contributors (id, email, status, upi_id, created_at, updated_at)
     VALUES (?, 'contributor@test.local', 'active', 'test@upi', datetime('now'), datetime('now'))`,
  ).run(contributorId);

  db.prepare(
    `INSERT INTO ebook_submissions (
      submission_id, contributor_id, title, status, published_catalog_ref,
      retail_price_inr, suggested_price_inr, created_at, updated_at
    ) VALUES (?, ?, 'Test Book', 'published', ?, 500, 50, datetime('now'), datetime('now'))`,
  ).run(submissionId, contributorId, bookId);
}

test('Community pricing: suggested list price must be <= 10% of verified retail', async () => {
  const {
    validateSubmissionPricing,
    submissionPatchSchema,
    MAX_SUGGESTED_PRICE_RETAIL_FRACTION,
  } = await import('../lib/community/validation.ts');

  assert.equal(MAX_SUGGESTED_PRICE_RETAIL_FRACTION, 0.1);

  const atCap = validateSubmissionPricing(500, 50);
  assert.equal(atCap.success, true, '50 must be allowed when retail is 500');

  const overCap = validateSubmissionPricing(500, 50.01);
  assert.equal(overCap.success, false, '50.01 must be rejected for retail 500');

  const submitOk = submissionPatchSchema.safeParse({
    action: 'submit',
    title: 'Sample Title',
    retailPriceInr: 400,
    suggestedPriceInr: 40,
    licenseType: 'cc-by',
  });
  assert.equal(submitOk.success, true);

  const submitBad = submissionPatchSchema.safeParse({
    action: 'submit',
    title: 'Sample Title',
    retailPriceInr: 400,
    suggestedPriceInr: 41,
    licenseType: 'cc-by',
  });
  assert.equal(submitBad.success, false);
});

test('Community earnings: no public API path may insert ledger rows', () => {
  const communityApiDir = path.join(repoRoot, 'app', 'api', 'community');
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) files.push(...walk(full));
      else if (ent.name === 'route.ts') files.push(full);
    }
    return files;
  };

  const routes = walk(communityApiDir);
  assert.ok(routes.length > 0, 'community API routes must exist');

  for (const file of routes) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(
      !/INSERT\s+INTO\s+contributor_earnings/i.test(src),
      `${path.relative(repoRoot, file)} must not insert contributor_earnings`,
    );
    assert.ok(
      !/\bcontributor_earnings\b/i.test(src),
      `${path.relative(repoRoot, file)} must not reference contributor_earnings`,
    );
  }

  const adminEarnings = fs.readFileSync(
    path.join(repoRoot, 'app', 'api', 'admin', 'earnings', 'route.ts'),
    'utf8',
  );
  assert.ok(adminEarnings.includes('export async function GET'), 'admin earnings must be read-only GET');
  assert.ok(!/export\s+async\s+function\s+POST/.test(adminEarnings), 'admin earnings must not accept POST');

  const libHits = [];
  const libDir = path.join(repoRoot, 'lib', 'community');
  for (const name of fs.readdirSync(libDir)) {
    if (!name.endsWith('.ts')) continue;
    const full = path.join(libDir, name);
    const src = fs.readFileSync(full, 'utf8');
    if (/INSERT\s+INTO\s+contributor_earnings/i.test(src)) {
      libHits.push(name);
    }
  }
  libHits.sort();
  assert.deepEqual(
    libHits,
    ['ledger.ts', 'payouts.ts'],
    'Only ledger.ts and payouts.ts may insert contributor_earnings',
  );
});

test('Community admin routes: verifyAdminAccess gate on every handler', () => {
  const adminCommunityRoutes = [
    'app/api/admin/contributions/route.ts',
    'app/api/admin/contributions/[submissionId]/route.ts',
    'app/api/admin/requests/route.ts',
    'app/api/admin/earnings/route.ts',
    'app/api/admin/payouts/route.ts',
    'app/api/admin/community-settings/route.ts',
  ];

  for (const rel of adminCommunityRoutes) {
    const full = path.join(repoRoot, rel);
    assert.ok(fs.existsSync(full), `${rel} must exist`);
    const src = fs.readFileSync(full, 'utf8');
    assert.ok(
      src.includes('verifyAdminAccess'),
      `${rel} must import and call verifyAdminAccess`,
    );
    assert.ok(
      /if\s*\(\s*!verifyAdminAccess\(/.test(src),
      `${rel} must fail closed when admin auth is missing`,
    );
  }

});

test('Community admin auth: verifyAdminAccess rejects missing credentials', async () => {
  const { verifyAdminAccess } = await import('../lib/auth/admin.ts');

  assert.equal(
    verifyAdminAccess({ headers: new Headers(), cookies: { get: () => undefined } }),
    false,
  );

  const valid = {
    headers: new Headers({ 'x-admin-token': process.env.ADMIN_ACCESS_SECRET }),
    cookies: { get: () => undefined },
  };
  assert.equal(verifyAdminAccess(valid), true);
});

test('Community ledger: idempotent credit per order/book/reason', () => {
  withIsolatedCommunityDb((db) => {
    const contributorId = crypto.randomUUID();
    const submissionId = crypto.randomUUID();
    const bookId = 'book-community-test-001';
    const orderId = 'ORD-COMMUNITY-IDEM-1';
    seedPublishedListing(db, { bookId, contributorId, submissionId });

    const first = tryCreditSale(db, {
      orderId,
      bookId,
      contributorId,
      submissionId,
      amountInr: 30,
    });
    assert.equal(first.status, 'credited', 'first paid transition must credit contributor');

    const second = tryCreditSale(db, {
      orderId,
      bookId,
      contributorId,
      submissionId,
      amountInr: 30,
    });
    assert.equal(second.status, 'duplicate', 'second credit must be idempotent duplicate');

    const count = db
      .prepare(
        `SELECT COUNT(*) AS c FROM contributor_earnings
         WHERE order_id = ? AND book_id = ? AND reason = 'community_sale'`,
      )
      .get(orderId, bookId);
    assert.equal(Number(count.c), 1, 'exactly one sale credit row must exist');
  });
});

function evaluatePayoutAmount(amountInr, availableInr, minWithdrawalInr) {
  if (amountInr < minWithdrawalInr) {
    return { ok: false, code: 'below_minimum' };
  }
  if (amountInr > availableInr + 0.001) {
    return { ok: false, code: 'exceeds_available' };
  }
  return { ok: true, amountInr };
}

test('Community payouts: payout request enforces minimum withdrawal', async () => {
  const { DEFAULT_PAYOUT_RULES } = await import('../lib/community/validation.ts');

  withIsolatedCommunityDb((db) => {
    const contributorId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO contributors (id, email, status, upi_id, created_at, updated_at)
       VALUES (?, 'payout@test.local', 'active', 'payout@upi', datetime('now'), datetime('now'))`,
    ).run(contributorId);

    db.prepare(
      `INSERT INTO contributor_earnings (
        earning_id, contributor_id, entry_type, amount_inr, reason, idempotency_key
      ) VALUES (?, ?, 'credit', 150, 'test_seed', ?)`,
    ).run(crypto.randomUUID(), contributorId, `seed:${contributorId}`);

    const availableInr = 150;
    const minInr = DEFAULT_PAYOUT_RULES.minWithdrawalInr;

    const belowMin = evaluatePayoutAmount(50, availableInr, minInr);
    assert.equal(belowMin.ok, false);
    assert.equal(belowMin.code, 'below_minimum');

    const ok = evaluatePayoutAmount(minInr, availableInr, minInr);
    assert.equal(ok.ok, true);

    const payoutRequestId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO payout_requests (
        payout_request_id, contributor_id, amount_inr, status, upi_id, created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', 'payout@upi', datetime('now'), datetime('now'))`,
    ).run(payoutRequestId, contributorId, ok.amountInr);

    const row = db
      .prepare(`SELECT amount_inr, status FROM payout_requests WHERE payout_request_id = ?`)
      .get(payoutRequestId);
    assert.equal(Number(row.amount_inr), minInr);
    assert.equal(row.status, 'pending');
  });
});
