import { randomUUID } from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { EbookSubmissionRow } from './types';
import type { SubmissionCreateInput, SubmissionPatchInput } from './validation';
import { CONTRIBUTOR_EDITABLE_STATUSES } from './validation';

function mapSubmission(row: Record<string, unknown>): EbookSubmissionRow {
  return {
    submission_id: String(row.submission_id),
    contributor_id: String(row.contributor_id),
    title: String(row.title),
    author: row.author != null ? String(row.author) : null,
    isbn13: row.isbn13 != null ? String(row.isbn13) : null,
    isbn10: row.isbn10 != null ? String(row.isbn10) : null,
    description: row.description != null ? String(row.description) : null,
    category: row.category != null ? String(row.category) : null,
    retail_price_inr: row.retail_price_inr != null ? Number(row.retail_price_inr) : null,
    suggested_price_inr: row.suggested_price_inr != null ? Number(row.suggested_price_inr) : null,
    license_type: row.license_type != null ? String(row.license_type) : null,
    source_url: row.source_url != null ? String(row.source_url) : null,
    proof_storage_key: row.proof_storage_key != null ? String(row.proof_storage_key) : null,
    status: row.status as EbookSubmissionRow['status'],
    admin_notes: row.admin_notes != null ? String(row.admin_notes) : null,
    published_catalog_ref: row.published_catalog_ref != null ? String(row.published_catalog_ref) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    submitted_at: row.submitted_at != null ? String(row.submitted_at) : null,
  };
}

export function serializeSubmissionPublic(row: EbookSubmissionRow) {
  return {
    submissionId: row.submission_id,
    title: row.title,
    author: row.author,
    isbn13: row.isbn13,
    isbn10: row.isbn10,
    description: row.description,
    category: row.category,
    retailPriceInr: row.retail_price_inr,
    suggestedPriceInr: row.suggested_price_inr,
    licenseType: row.license_type,
    sourceUrl: row.source_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}

export function createSubmissionDraft(
  db: DatabaseSync,
  contributorId: string,
  input: SubmissionCreateInput,
): EbookSubmissionRow {
  const submissionId = randomUUID();
  const title = input.title?.trim() || 'Untitled draft';

  db.prepare(
    `INSERT INTO ebook_submissions (
      submission_id, contributor_id, title, author, isbn13, isbn10,
      description, category, retail_price_inr, suggested_price_inr,
      license_type, source_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
  ).run(
    submissionId,
    contributorId,
    title,
    input.author?.trim() || null,
    input.isbn13 ?? null,
    input.isbn10 ?? null,
    input.description?.trim() || null,
    input.category?.trim() || null,
    input.retailPriceInr ?? null,
    input.suggestedPriceInr ?? null,
    input.licenseType?.trim() || null,
    input.sourceUrl ?? null,
  );

  return getSubmissionForContributor(db, contributorId, submissionId)!;
}

export function listSubmissionsForContributor(db: DatabaseSync, contributorId: string): EbookSubmissionRow[] {
  const rows = db
    .prepare(
      `SELECT * FROM ebook_submissions
       WHERE contributor_id = ?
       ORDER BY updated_at DESC`,
    )
    .all(contributorId) as Record<string, unknown>[];

  return rows.map(mapSubmission);
}

export function getSubmissionForContributor(
  db: DatabaseSync,
  contributorId: string,
  submissionId: string,
): EbookSubmissionRow | null {
  const row = db
    .prepare(
      `SELECT * FROM ebook_submissions
       WHERE submission_id = ? AND contributor_id = ?
       LIMIT 1`,
    )
    .get(submissionId, contributorId) as Record<string, unknown> | undefined;

  return row ? mapSubmission(row) : null;
}

export function patchSubmission(
  db: DatabaseSync,
  contributorId: string,
  submissionId: string,
  input: SubmissionPatchInput,
): { ok: true; submission: EbookSubmissionRow } | { ok: false; code: 'not_found' | 'not_editable' } {
  const existing = getSubmissionForContributor(db, contributorId, submissionId);
  if (!existing) return { ok: false, code: 'not_found' };
  if (!(CONTRIBUTOR_EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    return { ok: false, code: 'not_editable' };
  }

  const nextTitle = input.title?.trim() ?? existing.title;
  const nextStatus = input.action === 'submit' ? 'submitted' : 'draft';

  db.prepare(
    `UPDATE ebook_submissions SET
      title = ?,
      author = ?,
      isbn13 = ?,
      isbn10 = ?,
      description = ?,
      category = ?,
      retail_price_inr = ?,
      suggested_price_inr = ?,
      license_type = ?,
      source_url = ?,
      status = ?,
      submitted_at = CASE WHEN ? = 'submitted' THEN datetime('now') ELSE submitted_at END,
      updated_at = datetime('now')
     WHERE submission_id = ? AND contributor_id = ?`,
  ).run(
    nextTitle,
    input.author !== undefined ? input.author?.trim() || null : existing.author,
    input.isbn13 !== undefined ? input.isbn13 : existing.isbn13,
    input.isbn10 !== undefined ? input.isbn10 : existing.isbn10,
    input.description !== undefined ? input.description?.trim() || null : existing.description,
    input.category !== undefined ? input.category?.trim() || null : existing.category,
    input.retailPriceInr !== undefined ? input.retailPriceInr : existing.retail_price_inr,
    input.suggestedPriceInr !== undefined ? input.suggestedPriceInr : existing.suggested_price_inr,
    input.licenseType !== undefined ? input.licenseType?.trim() || null : existing.license_type,
    input.sourceUrl !== undefined ? input.sourceUrl ?? null : existing.source_url,
    nextStatus,
    nextStatus,
    submissionId,
    contributorId,
  );

  if (input.action === 'submit') {
    db.prepare(
      `INSERT OR IGNORE INTO ebook_licenses (license_id, submission_id, status)
       VALUES (?, ?, 'pending')`,
    ).run(randomUUID(), submissionId);
  }

  return { ok: true, submission: getSubmissionForContributor(db, contributorId, submissionId)! };
}
