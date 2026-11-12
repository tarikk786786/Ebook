import crypto from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openCommunityDatabase } from './db';
import { initCommunityMarketplaceDatabase } from './init';
import { writeCommunityAuditLog } from './admin-audit';
import {
  validateSubmissionPricing,
  parseRewardSplitSettings,
  rewardSplitSettingsSchema,
  PLATFORM_SETTING_PRICING_RULES,
  PLATFORM_SETTING_REWARD_SPLIT,
  DEFAULT_PRICING_RULES,
  DEFAULT_REWARD_SPLIT_SETTINGS,
} from './validation';
import type {
  EbookSubmissionStatus,
  LicenseVerificationStatus,
  EbookRequestStatus,
} from './types';

function openWritableCommunityDb(): DatabaseSync {
  initCommunityMarketplaceDatabase();
  const db = openCommunityDatabase();
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

export function getLicenseForSubmission(
  db: DatabaseSync,
  submissionId: string,
): {
  license_id: string;
  status: LicenseVerificationStatus;
  commercial_ok: number;
  platform: string | null;
  evidence_url: string | null;
  reviewer_notes: string | null;
} | null {
  const row = db
    .prepare(
      `SELECT license_id, status, commercial_ok, platform, evidence_url, reviewer_notes
       FROM ebook_licenses WHERE submission_id = ?`,
    )
    .get(submissionId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    license_id: String(row.license_id),
    status: row.status as LicenseVerificationStatus,
    commercial_ok: Number(row.commercial_ok) ? 1 : 0,
    platform: row.platform != null ? String(row.platform) : null,
    evidence_url: row.evidence_url != null ? String(row.evidence_url) : null,
    reviewer_notes: row.reviewer_notes != null ? String(row.reviewer_notes) : null,
  };
}

function ensureLicenseRow(db: DatabaseSync, submissionId: string): string {
  const existing = getLicenseForSubmission(db, submissionId);
  if (existing) return existing.license_id;
  const licenseId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO ebook_licenses (license_id, submission_id, status, commercial_ok, created_at, updated_at)
     VALUES (?, ?, 'pending', 0, datetime('now'), datetime('now'))`,
  ).run(licenseId, submissionId);
  return licenseId;
}

function getSubmissionRow(db: DatabaseSync, submissionId: string) {
  return db
    .prepare(`SELECT * FROM ebook_submissions WHERE submission_id = ?`)
    .get(submissionId) as Record<string, unknown> | undefined;
}

export type ContributionListItem = {
  submissionId: string;
  title: string;
  author: string | null;
  status: EbookSubmissionStatus;
  contributorEmail: string;
  contributorId: string;
  retailPriceInr: number | null;
  suggestedPriceInr: number | null;
  licenseStatus: LicenseVerificationStatus | null;
  commercialOk: boolean;
  submittedAt: string | null;
  updatedAt: string;
  adminNotes: string | null;
};

export function listContributions(options: {
  status?: string;
  licenseStatus?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): {
  items: ContributionListItem[];
  total: number;
  summary: Record<string, number>;
} {
  const db = openWritableCommunityDb();
  try {
    const limit = Math.min(Math.max(options.limit ?? 40, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const conditions: string[] = ["s.status != 'draft'"];
    const params: unknown[] = [];

    if (options.status) {
      conditions.push('s.status = ?');
      params.push(options.status);
    }
    if (options.licenseStatus) {
      conditions.push('l.status = ?');
      params.push(options.licenseStatus);
    }
    if (options.q?.trim()) {
      const like = `%${options.q.trim().toLowerCase()}%`;
      conditions.push(
        `(LOWER(s.title) LIKE ? OR LOWER(COALESCE(s.author,'')) LIKE ? OR LOWER(c.email) LIKE ?)`,
      );
      params.push(like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM ebook_submissions s
           JOIN contributors c ON c.id = s.contributor_id
           LEFT JOIN ebook_licenses l ON l.submission_id = s.submission_id
           ${where}`,
        )
        .get(...params) as { n: number }
    ).n;

    const rows = db
      .prepare(
        `SELECT s.submission_id, s.title, s.author, s.status, s.retail_price_inr, s.suggested_price_inr,
                s.submitted_at, s.updated_at, s.admin_notes,
                c.id AS contributor_id, c.email AS contributor_email,
                l.status AS license_status, l.commercial_ok
         FROM ebook_submissions s
         JOIN contributors c ON c.id = s.contributor_id
         LEFT JOIN ebook_licenses l ON l.submission_id = s.submission_id
         ${where}
         ORDER BY datetime(COALESCE(s.submitted_at, s.updated_at)) DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const summaryRows = db
      .prepare(
        `SELECT status, COUNT(*) AS n FROM ebook_submissions
         WHERE status != 'draft' GROUP BY status`,
      )
      .all() as { status: string; n: number }[];
    const summary: Record<string, number> = {};
    for (const r of summaryRows) summary[r.status] = r.n;

    const items: ContributionListItem[] = rows.map((r) => ({
      submissionId: String(r.submission_id),
      title: String(r.title),
      author: r.author != null ? String(r.author) : null,
      status: r.status as EbookSubmissionStatus,
      contributorEmail: String(r.contributor_email),
      contributorId: String(r.contributor_id),
      retailPriceInr: r.retail_price_inr != null ? Number(r.retail_price_inr) : null,
      suggestedPriceInr: r.suggested_price_inr != null ? Number(r.suggested_price_inr) : null,
      licenseStatus: r.license_status != null ? (r.license_status as LicenseVerificationStatus) : null,
      commercialOk: Boolean(Number(r.commercial_ok)),
      submittedAt: r.submitted_at != null ? String(r.submitted_at) : null,
      updatedAt: String(r.updated_at),
      adminNotes: r.admin_notes != null ? String(r.admin_notes) : null,
    }));

    return { items, total, summary };
  } finally {
    db.close();
  }
}

export function getContributionDetail(submissionId: string) {
  const db = openWritableCommunityDb();
  try {
    const row = db
      .prepare(
        `SELECT s.*, c.email AS contributor_email, c.display_name, c.upi_id,
                l.license_id, l.status AS license_status, l.commercial_ok, l.platform,
                l.evidence_url, l.reviewer_notes, l.last_checked_at
         FROM ebook_submissions s
         JOIN contributors c ON c.id = s.contributor_id
         LEFT JOIN ebook_licenses l ON l.submission_id = s.submission_id
         WHERE s.submission_id = ?`,
      )
      .get(submissionId) as Record<string, unknown> | undefined;

    if (!row) return null;

    const sources = db
      .prepare(`SELECT source_id, source_url, source_type, reachability_status, last_checked_at FROM ebook_sources WHERE submission_id = ?`)
      .all(submissionId) as Record<string, unknown>[];

    return {
      submissionId: String(row.submission_id),
      contributorId: String(row.contributor_id),
      contributorEmail: String(row.contributor_email),
      contributorName: row.display_name != null ? String(row.display_name) : null,
      contributorUpi: row.upi_id != null ? String(row.upi_id) : null,
      title: String(row.title),
      author: row.author != null ? String(row.author) : null,
      isbn13: row.isbn13 != null ? String(row.isbn13) : null,
      isbn10: row.isbn10 != null ? String(row.isbn10) : null,
      description: row.description != null ? String(row.description) : null,
      category: row.category != null ? String(row.category) : null,
      retailPriceInr: row.retail_price_inr != null ? Number(row.retail_price_inr) : null,
      suggestedPriceInr: row.suggested_price_inr != null ? Number(row.suggested_price_inr) : null,
      licenseType: row.license_type != null ? String(row.license_type) : null,
      sourceUrl: row.source_url != null ? String(row.source_url) : null,
      proofStorageKey: row.proof_storage_key != null ? String(row.proof_storage_key) : null,
      status: row.status as EbookSubmissionStatus,
      adminNotes: row.admin_notes != null ? String(row.admin_notes) : null,
      publishedCatalogRef: row.published_catalog_ref != null ? String(row.published_catalog_ref) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      submittedAt: row.submitted_at != null ? String(row.submitted_at) : null,
      license: row.license_id
        ? {
            licenseId: String(row.license_id),
            status: row.license_status as LicenseVerificationStatus,
            commercialOk: Boolean(Number(row.commercial_ok)),
            platform: row.platform != null ? String(row.platform) : null,
            evidenceUrl: row.evidence_url != null ? String(row.evidence_url) : null,
            reviewerNotes: row.reviewer_notes != null ? String(row.reviewer_notes) : null,
            lastCheckedAt: row.last_checked_at != null ? String(row.last_checked_at) : null,
          }
        : null,
      sources: sources.map((s) => ({
        sourceId: String(s.source_id),
        sourceUrl: String(s.source_url),
        sourceType: s.source_type != null ? String(s.source_type) : null,
        reachabilityStatus: String(s.reachability_status),
        lastCheckedAt: s.last_checked_at != null ? String(s.last_checked_at) : null,
      })),
    };
  } finally {
    db.close();
  }
}

export function adminRejectContribution(submissionId: string, adminNotes?: string) {
  const db = openWritableCommunityDb();
  try {
    const sub = getSubmissionRow(db, submissionId);
    if (!sub) return { ok: false as const, error: 'Submission not found' };
    if (sub.status === 'published') {
      return { ok: false as const, error: 'Cannot reject a published submission' };
    }

    db.prepare(
      `UPDATE ebook_submissions SET status = 'rejected', admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
       WHERE submission_id = ?`,
    ).run(adminNotes ?? null, submissionId);

    writeCommunityAuditLog(db, {
      action: 'contribution.rejected',
      entityType: 'ebook_submission',
      entityId: submissionId,
      metadata: { adminNotes: adminNotes ?? null, previousStatus: String(sub.status) },
    });

    return { ok: true as const, submissionId, status: 'rejected' as const };
  } finally {
    db.close();
  }
}

export function adminApproveContribution(submissionId: string, adminNotes?: string) {
  const db = openWritableCommunityDb();
  try {
    const sub = getSubmissionRow(db, submissionId);
    if (!sub) return { ok: false as const, error: 'Submission not found' };

    const terminal = ['rejected', 'published'];
    if (terminal.includes(String(sub.status))) {
      return { ok: false as const, error: `Cannot approve submission in status ${sub.status}` };
    }

    ensureLicenseRow(db, submissionId);
    const license = getLicenseForSubmission(db, submissionId);
    const licenseVerified = license?.status === 'verified';

    const retail = sub.retail_price_inr != null ? Number(sub.retail_price_inr) : null;
    const suggested = sub.suggested_price_inr != null ? Number(sub.suggested_price_inr) : null;
    if (retail != null && suggested != null) {
      const pricing = validateSubmissionPricing(retail, suggested);
      if (!pricing.success) {
        return { ok: false as const, error: pricing.error.issues[0]?.message ?? 'Invalid pricing' };
      }
    }

    const nextStatus: EbookSubmissionStatus = licenseVerified ? 'approved' : 'license_pending';

    db.prepare(
      `UPDATE ebook_submissions SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
       WHERE submission_id = ?`,
    ).run(nextStatus, adminNotes ?? null, submissionId);

    writeCommunityAuditLog(db, {
      action: 'contribution.approved',
      entityType: 'ebook_submission',
      entityId: submissionId,
      metadata: {
        adminNotes: adminNotes ?? null,
        previousStatus: String(sub.status),
        nextStatus,
        licenseVerified,
      },
    });

    return {
      ok: true as const,
      submissionId,
      status: nextStatus,
      licenseVerified,
      message: licenseVerified
        ? 'Approved — license verified. Use Publish when ready for storefront bridge.'
        : 'Marked license_pending — verify license before publish.',
    };
  } finally {
    db.close();
  }
}

export type UpdateLicenseInput = {
  status: LicenseVerificationStatus;
  commercialOk?: boolean;
  platform?: string;
  evidenceUrl?: string;
  reviewerNotes?: string;
};

export function adminUpdateLicenseVerification(submissionId: string, input: UpdateLicenseInput) {
  const db = openWritableCommunityDb();
  try {
    const sub = getSubmissionRow(db, submissionId);
    if (!sub) return { ok: false as const, error: 'Submission not found' };

    const licenseId = ensureLicenseRow(db, submissionId);
    const prev = getLicenseForSubmission(db, submissionId);

    db.prepare(
      `UPDATE ebook_licenses SET
         status = ?,
         commercial_ok = COALESCE(?, commercial_ok),
         platform = COALESCE(?, platform),
         evidence_url = COALESCE(?, evidence_url),
         reviewer_notes = COALESCE(?, reviewer_notes),
         last_checked_at = datetime('now'),
         updated_at = datetime('now')
       WHERE submission_id = ?`,
    ).run(
      input.status,
      input.commercialOk === undefined ? null : input.commercialOk ? 1 : 0,
      input.platform?.trim() || null,
      input.evidenceUrl?.trim() || null,
      input.reviewerNotes?.trim() || null,
      submissionId,
    );

    if (input.status === 'verified' && String(sub.status) === 'license_pending') {
      db.prepare(
        `UPDATE ebook_submissions SET status = 'approved', updated_at = datetime('now') WHERE submission_id = ?`,
      ).run(submissionId);
    }

    if (input.status === 'rejected' && !['rejected', 'published'].includes(String(sub.status))) {
      db.prepare(
        `UPDATE ebook_submissions SET status = 'license_pending', updated_at = datetime('now') WHERE submission_id = ?`,
      ).run(submissionId);
    }

    writeCommunityAuditLog(db, {
      action: 'license.verification_updated',
      entityType: 'ebook_license',
      entityId: licenseId,
      metadata: {
        submissionId,
        previousStatus: prev?.status ?? null,
        nextStatus: input.status,
        commercialOk: Boolean(input.commercialOk),
      },
    });

    return { ok: true as const, submissionId, licenseId, licenseStatus: input.status };
  } finally {
    db.close();
  }
}

export function adminPublishContribution(submissionId: string, catalogRef?: string) {
  const db = openWritableCommunityDb();
  try {
    const sub = getSubmissionRow(db, submissionId);
    if (!sub) return { ok: false as const, error: 'Submission not found' };

    if (String(sub.status) === 'published') {
      return { ok: true as const, submissionId, status: 'published' as const, alreadyPublished: true };
    }

    ensureLicenseRow(db, submissionId);
    const license = getLicenseForSubmission(db, submissionId);
    if (!license || license.status !== 'verified') {
      return {
        ok: false as const,
        error: 'Publish blocked: license must be verified before storefront publish',
        licenseStatus: license?.status ?? 'missing',
      };
    }

    if (!['approved', 'under_review'].includes(String(sub.status))) {
      return {
        ok: false as const,
        error: `Publish blocked: submission must be approved (current: ${sub.status})`,
      };
    }

    db.prepare(
      `UPDATE ebook_submissions SET
         status = 'published',
         published_catalog_ref = COALESCE(?, published_catalog_ref),
         updated_at = datetime('now')
       WHERE submission_id = ?`,
    ).run(catalogRef?.trim() || null, submissionId);

    writeCommunityAuditLog(db, {
      action: 'contribution.published',
      entityType: 'ebook_submission',
      entityId: submissionId,
      metadata: { catalogRef: catalogRef ?? null, licenseId: license.license_id },
    });

    return { ok: true as const, submissionId, status: 'published' as const };
  } finally {
    db.close();
  }
}

export function adminSetContributionReview(submissionId: string, adminNotes?: string) {
  const db = openWritableCommunityDb();
  try {
    const sub = getSubmissionRow(db, submissionId);
    if (!sub) return { ok: false as const, error: 'Submission not found' };

    db.prepare(
      `UPDATE ebook_submissions SET status = 'under_review', admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
       WHERE submission_id = ?`,
    ).run(adminNotes ?? null, submissionId);

    writeCommunityAuditLog(db, {
      action: 'contribution.under_review',
      entityType: 'ebook_submission',
      entityId: submissionId,
    });

    return { ok: true as const, submissionId, status: 'under_review' as const };
  } finally {
    db.close();
  }
}

export type RequestListItem = {
  requestId: string;
  title: string;
  author: string | null;
  requesterEmail: string;
  status: EbookRequestStatus;
  upvoteCount: number;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
};

export function listEbookRequests(options: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const db = openWritableCommunityDb();
  try {
    const limit = Math.min(Math.max(options.limit ?? 40, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }
    if (options.q?.trim()) {
      const like = `%${options.q.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(title) LIKE ? OR LOWER(COALESCE(author,'')) LIKE ? OR LOWER(requester_email) LIKE ?)`);
      params.push(like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) AS n FROM ebook_requests ${where}`).get(...params) as { n: number }).n;

    const rows = db
      .prepare(
        `SELECT request_id, title, author, requester_email, status, upvote_count, duplicate_of, created_at, updated_at
         FROM ebook_requests ${where}
         ORDER BY upvote_count DESC, datetime(updated_at) DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const summaryRows = db
      .prepare(`SELECT status, COUNT(*) AS n FROM ebook_requests GROUP BY status`)
      .all() as { status: string; n: number }[];
    const summary: Record<string, number> = {};
    for (const r of summaryRows) summary[r.status] = r.n;

    const items: RequestListItem[] = rows.map((r) => ({
      requestId: String(r.request_id),
      title: String(r.title),
      author: r.author != null ? String(r.author) : null,
      requesterEmail: String(r.requester_email),
      status: r.status as EbookRequestStatus,
      upvoteCount: Number(r.upvote_count),
      duplicateOf: r.duplicate_of != null ? String(r.duplicate_of) : null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    return { items, total, summary };
  } finally {
    db.close();
  }
}

export function adminUpdateRequestStatus(
  requestId: string,
  status: EbookRequestStatus,
  opts?: { duplicateOf?: string; adminNotes?: string },
) {
  const db = openWritableCommunityDb();
  try {
    const row = db.prepare(`SELECT * FROM ebook_requests WHERE request_id = ?`).get(requestId) as
      | Record<string, unknown>
      | undefined;
    if (!row) return { ok: false as const, error: 'Request not found' };

    if (status === 'duplicate' && opts?.duplicateOf) {
      const canon = db
        .prepare(`SELECT request_id FROM ebook_requests WHERE request_id = ?`)
        .get(opts.duplicateOf);
      if (!canon) return { ok: false as const, error: 'duplicate_of request not found' };
    }

    db.prepare(
      `UPDATE ebook_requests SET status = ?, duplicate_of = ?, notes = COALESCE(?, notes), updated_at = datetime('now')
       WHERE request_id = ?`,
    ).run(
      status,
      status === 'duplicate' ? opts?.duplicateOf ?? null : null,
      opts?.adminNotes?.trim() || null,
      requestId,
    );

    writeCommunityAuditLog(db, {
      action: 'request.status_updated',
      entityType: 'ebook_request',
      entityId: requestId,
      metadata: {
        previousStatus: String(row.status),
        nextStatus: status,
        duplicateOf: opts?.duplicateOf ?? null,
      },
    });

    return { ok: true as const, requestId, status };
  } finally {
    db.close();
  }
}

export function getCommunityPlatformSettings() {
  const db = openWritableCommunityDb();
  try {
    const rows = db
      .prepare(`SELECT setting_key, value_json, description, updated_at FROM platform_settings ORDER BY setting_key`)
      .all() as { setting_key: string; value_json: string; description: string | null; updated_at: string }[];

    const map: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        map[r.setting_key] = JSON.parse(r.value_json);
      } catch {
        map[r.setting_key] = r.value_json;
      }
    }

    return {
      ok: true as const,
      settings: map,
      rows: rows.map((r) => ({
        key: r.setting_key,
        description: r.description,
        updatedAt: r.updated_at,
      })),
      defaults: {
        [PLATFORM_SETTING_REWARD_SPLIT]: DEFAULT_REWARD_SPLIT_SETTINGS,
        [PLATFORM_SETTING_PRICING_RULES]: DEFAULT_PRICING_RULES,
      },
    };
  } finally {
    db.close();
  }
}

export function updateCommunityPlatformSettings(input: {
  rewardSplit?: unknown;
  pricingRules?: unknown;
}) {
  const db = openWritableCommunityDb();
  try {
    const upsert = db.prepare(`
      INSERT INTO platform_settings (setting_key, value_json, description, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(setting_key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = datetime('now')
    `);

    const changed: string[] = [];

    if (input.rewardSplit !== undefined) {
      const parsed = parseRewardSplitSettings(input.rewardSplit);
      rewardSplitSettingsSchema.parse(parsed);
      upsert.run(
        PLATFORM_SETTING_REWARD_SPLIT,
        JSON.stringify(parsed),
        'Configurable contributor/platform reward split',
      );
      changed.push(PLATFORM_SETTING_REWARD_SPLIT);
    }

    if (input.pricingRules !== undefined) {
      const rules =
        typeof input.pricingRules === 'object' && input.pricingRules !== null
          ? input.pricingRules
          : DEFAULT_PRICING_RULES;
      upsert.run(
        PLATFORM_SETTING_PRICING_RULES,
        JSON.stringify(rules),
        'Pricing validation rules for community submissions',
      );
      changed.push(PLATFORM_SETTING_PRICING_RULES);
    }

    if (changed.length === 0) {
      return { ok: false as const, error: 'No settings provided' };
    }

    writeCommunityAuditLog(db, {
      action: 'platform_settings.updated',
      entityType: 'platform_settings',
      metadata: { keys: changed },
    });

    return { ok: true as const, changed };
  } finally {
    db.close();
  }
}
