import type { DatabaseSync } from 'node:sqlite';
import type { ContributorRow } from './types';
import { serializeSubmissionPublic, listSubmissionsForContributor } from './submissions';
import {
  listContributorEarnings,
  listContributorPayoutRequests,
  loadPayoutRulesSettings,
} from './payouts';

export function getContributorEarningsSummary(db: DatabaseSync, contributorId: string) {
  const rows = db
    .prepare(
      `SELECT entry_type, amount_inr FROM contributor_earnings
       WHERE contributor_id = ?`,
    )
    .all(contributorId) as { entry_type: string; amount_inr: number }[];

  let credits = 0;
  let debits = 0;
  for (const row of rows) {
    if (row.entry_type === 'credit') credits += Number(row.amount_inr);
    else debits += Number(row.amount_inr);
  }

  const pendingPayout = db
    .prepare(
      `SELECT COALESCE(SUM(amount_inr), 0) AS total FROM payout_requests
       WHERE contributor_id = ? AND status IN ('pending', 'approved')`,
    )
    .get(contributorId) as { total: number };

  const balanceInr = Math.max(0, credits - debits);
  const pendingPayoutInr = Number(pendingPayout?.total ?? 0);
  const availableInr = Math.max(0, Math.round((balanceInr - pendingPayoutInr) * 100) / 100);

  return {
    ledgerReady: rows.length > 0,
    balanceInr,
    lifetimeNetInr: balanceInr,
    creditsTotalInr: credits,
    debitsTotalInr: debits,
    pendingPayoutInr,
    availableInr,
  };
}

export function buildContributorMePayload(contributor: ContributorRow, db: DatabaseSync) {
  const submissions = listSubmissionsForContributor(db, contributor.id);
  const byStatus: Record<string, number> = {};
  for (const s of submissions) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  }

  return {
    contributor: {
      id: contributor.id,
      email: contributor.email,
      displayName: contributor.display_name,
      upiId: contributor.upi_id,
      upiVerifiedAt: contributor.upi_verified_at,
      status: contributor.status,
      createdAt: contributor.created_at,
    },
    submissions: {
      total: submissions.length,
      byStatus,
      recent: submissions.slice(0, 10).map(serializeSubmissionPublic),
    },
    earnings: getContributorEarningsSummary(db, contributor.id),
    payoutRules: loadPayoutRulesSettings(db),
    recentEarnings: listContributorEarnings(db, contributor.id, 25),
    payouts: listContributorPayoutRequests(db, contributor.id, 25),
  };
}
