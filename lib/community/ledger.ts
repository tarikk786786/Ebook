import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { StoredOrder, OrderItem } from '@/lib/orders/store';
import { openCommunityDatabase } from './db';
import { initCommunityMarketplaceDatabase } from './init';
import {
  DEFAULT_REWARD_SPLIT_SETTINGS,
  PLATFORM_SETTING_REWARD_SPLIT,
  parseRewardSplitSettings,
  type RewardSplitSettings,
} from './validation';

/** Ledger reason codes — idempotency is UNIQUE(order_id, book_id, reason) via idempotency_key. */
export const EARNING_REASON_COMMUNITY_SALE = 'community_sale';
export const EARNING_REASON_COMMUNITY_SALE_REFUND = 'community_sale_refund';

export function buildEarningsIdempotencyKey(
  orderId: string,
  bookId: string,
  reason: string,
): string {
  return `${orderId}:${bookId}:${reason}`;
}

function roundInr(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function loadRewardSplitSettings(db: DatabaseSync): RewardSplitSettings {
  const row = db
    .prepare(`SELECT value_json FROM platform_settings WHERE setting_key = ?`)
    .get(PLATFORM_SETTING_REWARD_SPLIT) as { value_json: string } | undefined;

  if (!row?.value_json) {
    return DEFAULT_REWARD_SPLIT_SETTINGS;
  }

  try {
    return parseRewardSplitSettings(JSON.parse(row.value_json));
  } catch {
    return DEFAULT_REWARD_SPLIT_SETTINGS;
  }
}

type PublishedSubmissionRef = {
  submission_id: string;
  contributor_id: string;
};

function findPublishedCommunitySubmission(
  db: DatabaseSync,
  catalogBookId: string,
): PublishedSubmissionRef | null {
  const row = db
    .prepare(
      `SELECT submission_id, contributor_id
       FROM ebook_submissions
       WHERE published_catalog_ref = ?
         AND status IN ('approved', 'published')
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
    .get(catalogBookId) as PublishedSubmissionRef | undefined;

  return row ?? null;
}

function contributorEligible(db: DatabaseSync, contributorId: string): boolean {
  const row = db
    .prepare(`SELECT status FROM contributors WHERE id = ?`)
    .get(contributorId) as { status: string } | undefined;
  return row?.status === 'active';
}

export type LedgerCreditLineResult =
  | { status: 'credited'; earningId: string; amountInr: number }
  | { status: 'duplicate' }
  | { status: 'skipped'; cause: string };

export type LedgerCreditOrderResult = {
  orderId: string;
  lines: Array<{ bookId: string; result: LedgerCreditLineResult }>;
};

function creditOneOrderItem(
  db: DatabaseSync,
  order: StoredOrder,
  item: OrderItem,
  split: RewardSplitSettings,
): LedgerCreditLineResult {
  const submission = findPublishedCommunitySubmission(db, item.bookId);
  if (!submission) {
    return { status: 'skipped', cause: 'no_published_community_listing' };
  }

  if (!contributorEligible(db, submission.contributor_id)) {
    return { status: 'skipped', cause: 'contributor_not_active' };
  }

  const listPriceInr = item.priceInInr;
  if (!Number.isFinite(listPriceInr) || listPriceInr <= 0) {
    return { status: 'skipped', cause: 'invalid_line_price' };
  }

  const amountInr = roundInr(listPriceInr * split.contributorShareOfListPrice);
  if (amountInr <= 0) {
    return { status: 'skipped', cause: 'zero_contributor_share' };
  }

  const reason = EARNING_REASON_COMMUNITY_SALE;
  const idempotencyKey = buildEarningsIdempotencyKey(order.orderId, item.bookId, reason);
  const earningId = randomUUID();

  const insert = db.prepare(`
    INSERT INTO contributor_earnings (
      earning_id, contributor_id, entry_type, amount_inr,
      order_id, book_id, submission_id, reason, idempotency_key
    ) VALUES (?, ?, 'credit', ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(
      earningId,
      submission.contributor_id,
      amountInr,
      order.orderId,
      item.bookId,
      submission.submission_id,
      reason,
      idempotencyKey,
    );
    return { status: 'credited', earningId, amountInr };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint failed/i.test(message)) {
      return { status: 'duplicate' };
    }
    throw err;
  }
}

/**
 * Idempotent contributor credits for settled order items linked to approved/published submissions.
 * Never touches affiliate JSON counters; uses platform_settings reward split only.
 */
export function creditContributorEarningsForPaidOrder(order: StoredOrder): LedgerCreditOrderResult {
  const lines: LedgerCreditOrderResult['lines'] = [];

  if (!order.items?.length) {
    return { orderId: order.orderId, lines };
  }

  let db: DatabaseSync;
  try {
    initCommunityMarketplaceDatabase();
    db = openCommunityDatabase();
  } catch (err) {
    console.warn('[community/ledger] DB unavailable; skipping earnings credit:', err);
    for (const item of order.items) {
      lines.push({
        bookId: item.bookId,
        result: { status: 'skipped', cause: 'community_db_unavailable' },
      });
    }
    return { orderId: order.orderId, lines };
  }

  try {
    db.exec('PRAGMA foreign_keys = ON;');
    const split = loadRewardSplitSettings(db);

    for (const item of order.items) {
      try {
        const result = creditOneOrderItem(db, order, item, split);
        lines.push({ bookId: item.bookId, result });
      } catch (itemErr) {
        console.warn('[community/ledger] Item credit failed:', order.orderId, item.bookId, itemErr);
        lines.push({
          bookId: item.bookId,
          result: { status: 'skipped', cause: 'insert_error' },
        });
      }
    }
  } finally {
    db.close();
  }

  return { orderId: order.orderId, lines };
}

export type LedgerDebitLineResult =
  | { status: 'debited'; earningId: string; amountInr: number }
  | { status: 'duplicate' }
  | { status: 'skipped'; cause: string };

export type LedgerDebitOrderResult = {
  orderId: string;
  lines: Array<{ bookId: string; result: LedgerDebitLineResult }>;
};

/**
 * Admin-marked refund stub: posts a matching debit row for a prior sale credit (no FamGateway refund API).
 */
export function debitContributorEarningsForRefundedOrderItem(params: {
  orderId: string;
  bookId: string;
  adminActorId?: string;
}): LedgerDebitLineResult {
  const { orderId, bookId } = params;
  const saleReason = EARNING_REASON_COMMUNITY_SALE;
  const refundReason = EARNING_REASON_COMMUNITY_SALE_REFUND;

  let db: DatabaseSync;
  try {
    initCommunityMarketplaceDatabase();
    db = openCommunityDatabase();
  } catch (err) {
    console.warn('[community/ledger] DB unavailable; skipping refund debit:', err);
    return { status: 'skipped', cause: 'community_db_unavailable' };
  }

  try {
    db.exec('PRAGMA foreign_keys = ON;');

    const creditRow = db
      .prepare(
        `SELECT earning_id, contributor_id, amount_inr, submission_id
         FROM contributor_earnings
         WHERE order_id = ? AND book_id = ? AND entry_type = 'credit' AND reason = ?
         LIMIT 1`,
      )
      .get(orderId, bookId, saleReason) as
      | {
          earning_id: string;
          contributor_id: string;
          amount_inr: number;
          submission_id: string | null;
        }
      | undefined;

    if (!creditRow) {
      return { status: 'skipped', cause: 'no_prior_sale_credit' };
    }

    const idempotencyKey = buildEarningsIdempotencyKey(orderId, bookId, refundReason);
    const earningId = randomUUID();
    const amountInr = roundInr(Number(creditRow.amount_inr));

    const insert = db.prepare(`
      INSERT INTO contributor_earnings (
        earning_id, contributor_id, entry_type, amount_inr,
        order_id, book_id, submission_id, reason, idempotency_key
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?)
    `);

    try {
      insert.run(
        earningId,
        creditRow.contributor_id,
        amountInr,
        orderId,
        bookId,
        creditRow.submission_id,
        refundReason,
        idempotencyKey,
      );

      if (params.adminActorId) {
        db.prepare(
          `INSERT INTO audit_logs (audit_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json)
           VALUES (?, 'admin', ?, 'community_sale_refund_debit', 'order', ?, ?)`,
        ).run(
          randomUUID(),
          params.adminActorId,
          orderId,
          JSON.stringify({ bookId, creditEarningId: creditRow.earning_id, debitEarningId: earningId }),
        );
      }

      return { status: 'debited', earningId, amountInr };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (/UNIQUE constraint failed/i.test(message)) {
        return { status: 'duplicate' };
      }
      throw err;
    }
  } finally {
    db.close();
  }
}

/**
 * Reverse all community sale credits for an order (admin refund workflow stub).
 */
export function debitContributorEarningsForRefundedOrder(
  orderId: string,
  bookIds: string[],
  adminActorId?: string,
): LedgerDebitOrderResult {
  const lines: LedgerDebitOrderResult['lines'] = [];
  for (const bookId of bookIds) {
    lines.push({
      bookId,
      result: debitContributorEarningsForRefundedOrderItem({ orderId, bookId, adminActorId }),
    });
  }
  return { orderId, lines };
}
