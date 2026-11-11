import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { ContributorRow } from './types';
import { openCommunityDatabase } from './db';
import { initCommunityMarketplaceDatabase } from './init';
import { writeCommunityAuditLog } from './admin-audit';
import {
  DEFAULT_PAYOUT_RULES,
  PLATFORM_SETTING_PAYOUT_RULES,
  parsePayoutRulesSettings,
  type PayoutRulesSettings,
} from './validation';

export const EARNING_REASON_PAYOUT = 'payout';

function roundInr(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function loadPayoutRulesSettings(db: DatabaseSync): PayoutRulesSettings {
  const row = db
    .prepare(`SELECT value_json FROM platform_settings WHERE setting_key = ?`)
    .get(PLATFORM_SETTING_PAYOUT_RULES) as { value_json: string } | undefined;

  if (!row?.value_json) {
    return DEFAULT_PAYOUT_RULES;
  }

  try {
    return parsePayoutRulesSettings(JSON.parse(row.value_json));
  } catch {
    return DEFAULT_PAYOUT_RULES;
  }
}

export type ContributorBalances = {
  lifetimeNetInr: number;
  creditsTotalInr: number;
  debitsTotalInr: number;
  pendingPayoutInr: number;
  availableInr: number;
  ledgerReady: boolean;
};

function summarizeLedger(db: DatabaseSync, contributorId: string) {
  const rows = db
    .prepare(
      `SELECT entry_type, amount_inr FROM contributor_earnings WHERE contributor_id = ?`,
    )
    .all(contributorId) as { entry_type: string; amount_inr: number }[];

  let credits = 0;
  let debits = 0;
  for (const row of rows) {
    if (row.entry_type === 'credit') credits += Number(row.amount_inr);
    else debits += Number(row.amount_inr);
  }

  const pendingRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount_inr), 0) AS total FROM payout_requests
       WHERE contributor_id = ? AND status IN ('pending', 'approved')`,
    )
    .get(contributorId) as { total: number };

  const balanceInr = Math.max(0, credits - debits);
  const pendingPayoutInr = Number(pendingRow?.total ?? 0);

  return {
    ledgerReady: rows.length > 0,
    balanceInr,
    creditsTotalInr: credits,
    debitsTotalInr: debits,
    pendingPayoutInr,
    availableInr: Math.max(0, roundInr(balanceInr - pendingPayoutInr)),
  };
}

export function getContributorBalances(db: DatabaseSync, contributorId: string): ContributorBalances {
  const summary = summarizeLedger(db, contributorId);
  return {
    lifetimeNetInr: summary.balanceInr,
    creditsTotalInr: summary.creditsTotalInr,
    debitsTotalInr: summary.debitsTotalInr,
    pendingPayoutInr: summary.pendingPayoutInr,
    availableInr: summary.availableInr,
    ledgerReady: summary.ledgerReady,
  };
}

export type EarningLedgerRow = {
  earningId: string;
  entryType: string;
  amountInr: number;
  orderId: string | null;
  bookId: string | null;
  reason: string | null;
  createdAt: string;
};

export function listContributorEarnings(
  db: DatabaseSync,
  contributorId: string,
  limit = 30,
): EarningLedgerRow[] {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rows = db
    .prepare(
      `SELECT earning_id, entry_type, amount_inr, order_id, book_id, reason, created_at
       FROM contributor_earnings
       WHERE contributor_id = ?
       ORDER BY datetime(created_at) DESC, earning_id DESC
       LIMIT ?`,
    )
    .all(contributorId, safeLimit) as Record<string, unknown>[];

  return rows.map((r) => ({
    earningId: String(r.earning_id),
    entryType: String(r.entry_type),
    amountInr: Number(r.amount_inr),
    orderId: r.order_id != null ? String(r.order_id) : null,
    bookId: r.book_id != null ? String(r.book_id) : null,
    reason: r.reason != null ? String(r.reason) : null,
    createdAt: String(r.created_at),
  }));
}

export type PayoutRequestPublic = {
  payoutRequestId: string;
  amountInr: number;
  status: string;
  upiId: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  adminRef: string | null;
};

export function listContributorPayoutRequests(
  db: DatabaseSync,
  contributorId: string,
  limit = 30,
): PayoutRequestPublic[] {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rows = db
    .prepare(
      `SELECT pr.payout_request_id, pr.amount_inr, pr.status, pr.upi_id, pr.admin_notes,
              pr.created_at, pr.updated_at,
              pt.paid_at, pt.admin_ref
       FROM payout_requests pr
       LEFT JOIN payout_transactions pt ON pt.payout_request_id = pr.payout_request_id
       WHERE pr.contributor_id = ?
       ORDER BY datetime(pr.created_at) DESC
       LIMIT ?`,
    )
    .all(contributorId, safeLimit) as Record<string, unknown>[];

  return rows.map((r) => ({
    payoutRequestId: String(r.payout_request_id),
    amountInr: Number(r.amount_inr),
    status: String(r.status),
    upiId: String(r.upi_id),
    adminNotes: r.admin_notes != null ? String(r.admin_notes) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    paidAt: r.paid_at != null ? String(r.paid_at) : null,
    adminRef: r.admin_ref != null ? String(r.admin_ref) : null,
  }));
}

export type CreatePayoutRequestResult =
  | { ok: true; payoutRequestId: string; amountInr: number; status: 'pending' }
  | { ok: false; error: string; code?: string };

export function createContributorPayoutRequest(
  db: DatabaseSync,
  contributor: ContributorRow,
  requestedAmountInr?: number,
): CreatePayoutRequestResult {
  if (contributor.status !== 'active') {
    return { ok: false, error: 'Contributor account is not active.', code: 'contributor_inactive' };
  }

  const upi = contributor.upi_id?.trim();
  if (!upi || upi.length < 3) {
    return {
      ok: false,
      error: 'Add a verified UPI ID on your profile before requesting payout.',
      code: 'upi_missing',
    };
  }

  const rules = loadPayoutRulesSettings(db);
  const balances = getContributorBalances(db, contributor.id);

  if (balances.availableInr <= 0) {
    return { ok: false, error: 'No available balance to withdraw.', code: 'insufficient_balance' };
  }

  const amountInr = roundInr(requestedAmountInr ?? balances.availableInr);

  if (amountInr < rules.minWithdrawalInr) {
    return {
      ok: false,
      error: `Minimum withdrawal is ₹${rules.minWithdrawalInr.toFixed(2)}.`,
      code: 'below_minimum',
    };
  }

  if (amountInr > balances.availableInr + 0.001) {
    return {
      ok: false,
      error: `Requested amount exceeds available balance (₹${balances.availableInr.toFixed(2)}).`,
      code: 'exceeds_available',
    };
  }

  const openCount = db
    .prepare(
      `SELECT COUNT(*) AS c FROM payout_requests
       WHERE contributor_id = ? AND status IN ('pending', 'approved')`,
    )
    .get(contributor.id) as { c: number };

  if (Number(openCount?.c ?? 0) > 0) {
    return {
      ok: false,
      error: 'You already have an open payout request. Wait for admin review.',
      code: 'open_request_exists',
    };
  }

  const payoutRequestId = randomUUID();
  const insert = db.prepare(`
    INSERT INTO payout_requests (
      payout_request_id, contributor_id, amount_inr, status, upi_id, created_at, updated_at
    ) VALUES (?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
  `);

  insert.run(payoutRequestId, contributor.id, amountInr, upi);

  writeCommunityAuditLog(db, {
    actorType: 'contributor',
    actorId: contributor.id,
    action: 'payout_request.created',
    entityType: 'payout_request',
    entityId: payoutRequestId,
    metadata: { amountInr, upiIdMasked: maskUpi(upi) },
  });

  return { ok: true, payoutRequestId, amountInr, status: 'pending' };
}

function maskUpi(upi: string): string {
  const at = upi.indexOf('@');
  if (at <= 1) return '***';
  return `${upi.slice(0, 2)}***${upi.slice(at)}`;
}

export type AdminPayoutQueueRow = {
  payoutRequestId: string;
  contributorId: string;
  contributorEmail: string;
  contributorName: string | null;
  amountInr: number;
  status: string;
  upiId: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  adminRef: string | null;
};

export function listAdminPayoutQueue(opts: {
  status?: string;
  limit?: number;
  offset?: number;
}): { items: AdminPayoutQueueRow[]; total: number; summary: Record<string, number> } {
  const limit = Math.min(Math.max(1, opts.limit ?? 40), 100);
  const offset = Math.max(0, opts.offset ?? 0);

  const db = openForPayouts();
  try {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.status) {
      where.push('pr.status = ?');
      params.push(opts.status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS c FROM payout_requests pr ${whereSql}`)
      .get(...params) as { c: number };

    const rows = db
      .prepare(
        `SELECT pr.payout_request_id, pr.contributor_id, c.email, c.display_name,
                pr.amount_inr, pr.status, pr.upi_id, pr.admin_notes, pr.created_at, pr.updated_at,
                pt.paid_at, pt.admin_ref
         FROM payout_requests pr
         JOIN contributors c ON c.id = pr.contributor_id
         LEFT JOIN payout_transactions pt ON pt.payout_request_id = pr.payout_request_id
         ${whereSql}
         ORDER BY datetime(pr.created_at) DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const summaryRows = db
      .prepare(`SELECT status, COUNT(*) AS c FROM payout_requests GROUP BY status`)
      .all() as { status: string; c: number }[];
    const summary: Record<string, number> = {};
    for (const s of summaryRows) {
      summary[s.status] = Number(s.c);
    }

    const items = rows.map((r) => ({
      payoutRequestId: String(r.payout_request_id),
      contributorId: String(r.contributor_id),
      contributorEmail: String(r.email),
      contributorName: r.display_name != null ? String(r.display_name) : null,
      amountInr: Number(r.amount_inr),
      status: String(r.status),
      upiId: String(r.upi_id),
      adminNotes: r.admin_notes != null ? String(r.admin_notes) : null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      paidAt: r.paid_at != null ? String(r.paid_at) : null,
      adminRef: r.admin_ref != null ? String(r.admin_ref) : null,
    }));

    return { items, total: Number(totalRow?.c ?? 0), summary };
  } finally {
    db.close();
  }
}

export type AdminEarningsRow = {
  earningId: string;
  contributorId: string;
  contributorEmail: string;
  entryType: string;
  amountInr: number;
  orderId: string | null;
  bookId: string | null;
  reason: string | null;
  createdAt: string;
};

export function listAdminEarningsLedger(opts: {
  contributorId?: string;
  entryType?: string;
  limit?: number;
  offset?: number;
}): { items: AdminEarningsRow[]; total: number; totals: { creditsInr: number; debitsInr: number } } {
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 100);
  const offset = Math.max(0, opts.offset ?? 0);

  const db = openForPayouts();
  try {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.contributorId) {
      where.push('e.contributor_id = ?');
      params.push(opts.contributorId);
    }
    if (opts.entryType) {
      where.push('e.entry_type = ?');
      params.push(opts.entryType);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS c FROM contributor_earnings e ${whereSql}`)
      .get(...params) as { c: number };

    const totalsRow = db
      .prepare(
        `SELECT
          COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount_inr ELSE 0 END), 0) AS credits,
          COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount_inr ELSE 0 END), 0) AS debits
         FROM contributor_earnings e ${whereSql}`,
      )
      .get(...params) as { credits: number; debits: number };

    const rows = db
      .prepare(
        `SELECT e.earning_id, e.contributor_id, c.email, e.entry_type, e.amount_inr,
                e.order_id, e.book_id, e.reason, e.created_at
         FROM contributor_earnings e
         JOIN contributors c ON c.id = e.contributor_id
         ${whereSql}
         ORDER BY datetime(e.created_at) DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const items = rows.map((r) => ({
      earningId: String(r.earning_id),
      contributorId: String(r.contributor_id),
      contributorEmail: String(r.email),
      entryType: String(r.entry_type),
      amountInr: Number(r.amount_inr),
      orderId: r.order_id != null ? String(r.order_id) : null,
      bookId: r.book_id != null ? String(r.book_id) : null,
      reason: r.reason != null ? String(r.reason) : null,
      createdAt: String(r.created_at),
    }));

    return {
      items,
      total: Number(totalRow?.c ?? 0),
      totals: {
        creditsInr: Number(totalsRow?.credits ?? 0),
        debitsInr: Number(totalsRow?.debits ?? 0),
      },
    };
  } finally {
    db.close();
  }
}

function openForPayouts(): DatabaseSync {
  initCommunityMarketplaceDatabase();
  const db = openCommunityDatabase();
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

export type AdminPayoutActionResult =
  | { ok: true; payoutRequestId: string; status: string; message?: string }
  | { ok: false; error: string };

export function adminUpdatePayoutRequestStatus(
  payoutRequestId: string,
  action: 'approve' | 'reject' | 'cancel',
  opts?: { adminNotes?: string; actorId?: string },
): AdminPayoutActionResult {
  const db = openForPayouts();
  try {
    const row = db
      .prepare(`SELECT status, contributor_id, amount_inr FROM payout_requests WHERE payout_request_id = ?`)
      .get(payoutRequestId) as { status: string; contributor_id: string; amount_inr: number } | undefined;

    if (!row) {
      return { ok: false, error: 'Payout request not found.' };
    }

    if (row.status === 'paid') {
      return { ok: false, error: 'Payout already completed.' };
    }

    const nextStatus =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled';

    if (action === 'approve' && row.status !== 'pending') {
      return { ok: false, error: 'Only pending requests can be approved.' };
    }
    if (action === 'reject' && !['pending', 'approved'].includes(row.status)) {
      return { ok: false, error: 'Cannot reject this payout in its current status.' };
    }

    db.prepare(
      `UPDATE payout_requests SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
       WHERE payout_request_id = ?`,
    ).run(nextStatus, opts?.adminNotes?.trim() || null, payoutRequestId);

    writeCommunityAuditLog(db, {
      actorId: opts?.actorId,
      action: `payout_request.${action}`,
      entityType: 'payout_request',
      entityId: payoutRequestId,
      metadata: { previousStatus: row.status, nextStatus, amountInr: row.amount_inr },
    });

    return {
      ok: true,
      payoutRequestId,
      status: nextStatus,
      message: `Payout marked ${nextStatus}.`,
    };
  } finally {
    db.close();
  }
}

/**
 * Manual UPI settlement — provider-independent; requires admin-entered payout reference after transfer.
 */
export function adminMarkPayoutPaidManual(
  payoutRequestId: string,
  adminRef: string,
  opts?: { actorId?: string },
): AdminPayoutActionResult {
  const ref = adminRef.trim();
  if (ref.length < 4) {
    return { ok: false, error: 'Payout reference ID is required (min 4 characters).' };
  }

  const db = openForPayouts();
  try {
    db.exec('BEGIN IMMEDIATE;');
    const row = db
      .prepare(
        `SELECT pr.status, pr.contributor_id, pr.amount_inr, pr.upi_id
         FROM payout_requests pr
         WHERE pr.payout_request_id = ?`,
      )
      .get(payoutRequestId) as
      | { status: string; contributor_id: string; amount_inr: number; upi_id: string }
      | undefined;

    if (!row) {
      db.exec('ROLLBACK;');
      return { ok: false, error: 'Payout request not found.' };
    }

    if (row.status === 'paid') {
      db.exec('ROLLBACK;');
      return { ok: false, error: 'Payout already marked paid.' };
    }

    if (!['pending', 'approved'].includes(row.status)) {
      db.exec('ROLLBACK;');
      return { ok: false, error: 'Only pending or approved requests can be marked paid.' };
    }

    const amountInr = roundInr(Number(row.amount_inr));
    const balances = getContributorBalances(db, row.contributor_id);
    if (amountInr > balances.availableInr + 0.001) {
      db.exec('ROLLBACK;');
      return {
        ok: false,
        error: `Insufficient available balance (₹${balances.availableInr.toFixed(2)}) for this payout.`,
      };
    }

    const transactionId = randomUUID();
    const paidAt = new Date().toISOString();
    const earningId = randomUUID();
    const idempotencyKey = `payout:${payoutRequestId}`;

    db.prepare(
      `INSERT INTO payout_transactions (
        transaction_id, payout_request_id, amount_inr, admin_ref, paid_at, recorded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    ).run(transactionId, payoutRequestId, amountInr, ref, paidAt, opts?.actorId ?? null);

    db.prepare(
      `UPDATE payout_requests SET status = 'paid', updated_at = datetime('now') WHERE payout_request_id = ?`,
    ).run(payoutRequestId);

    const insertDebit = db.prepare(`
      INSERT INTO contributor_earnings (
        earning_id, contributor_id, entry_type, amount_inr,
        order_id, book_id, submission_id, reason, idempotency_key
      ) VALUES (?, ?, 'debit', ?, NULL, NULL, NULL, ?, ?)
    `);

    try {
      insertDebit.run(
        earningId,
        row.contributor_id,
        amountInr,
        EARNING_REASON_PAYOUT,
        idempotencyKey,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (/UNIQUE constraint failed/i.test(message)) {
        db.exec('ROLLBACK;');
        return { ok: false, error: 'Ledger debit already recorded for this payout.' };
      }
      throw err;
    }

    writeCommunityAuditLog(db, {
      actorId: opts?.actorId,
      action: 'payout_request.marked_paid',
      entityType: 'payout_request',
      entityId: payoutRequestId,
      metadata: {
        adminRef: ref,
        transactionId,
        debitEarningId: earningId,
        amountInr,
        upiIdMasked: maskUpi(row.upi_id),
        adapter: 'manual_upi',
      },
    });

    db.exec('COMMIT;');

    return {
      ok: true,
      payoutRequestId,
      status: 'paid',
      message: 'Payout recorded with manual UPI reference.',
    };
  } catch (e) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    db.close();
  }
}
