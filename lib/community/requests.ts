import { createHash, randomUUID } from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import { normalizeRequestMatchKey } from './normalize';
import type { EbookRequestCreateInput } from './validation';

export type PublicEbookRequest = {
  requestId: string;
  title: string;
  author: string | null;
  isbn13: string | null;
  isbn10: string | null;
  notes: string | null;
  status: string;
  upvoteCount: number;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRequest(row: Record<string, unknown>): PublicEbookRequest {
  return {
    requestId: String(row.request_id),
    title: String(row.title),
    author: row.author != null ? String(row.author) : null,
    isbn13: row.isbn13 != null ? String(row.isbn13) : null,
    isbn10: row.isbn10 != null ? String(row.isbn10) : null,
    notes: row.notes != null ? String(row.notes) : null,
    status: String(row.status),
    upvoteCount: Number(row.upvote_count),
    duplicateOf: row.duplicate_of != null ? String(row.duplicate_of) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function findDuplicateRequest(
  db: DatabaseSync,
  title: string,
  author: string | null | undefined,
): PublicEbookRequest | null {
  const { titleKey, authorKey } = normalizeRequestMatchKey(title, author);

  const candidates = db
    .prepare(
      `SELECT * FROM ebook_requests
       WHERE status IN ('open', 'in_progress')
       ORDER BY created_at ASC`,
    )
    .all() as Record<string, unknown>[];

  for (const row of candidates) {
    const keys = normalizeRequestMatchKey(String(row.title), row.author as string | null);
    if (keys.titleKey === titleKey && keys.authorKey === authorKey) {
      return mapRequest(row);
    }
  }
  return null;
}

export function createEbookRequest(
  db: DatabaseSync,
  input: EbookRequestCreateInput,
): PublicEbookRequest {
  const requestId = randomUUID();
  db.prepare(
    `INSERT INTO ebook_requests (
      request_id, requester_email, title, author, isbn13, isbn10, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
  ).run(
    requestId,
    input.email,
    input.title.trim(),
    input.author?.trim() || null,
    input.isbn13 ?? null,
    input.isbn10 ?? null,
    input.notes?.trim() || null,
  );

  const row = db.prepare(`SELECT * FROM ebook_requests WHERE request_id = ?`).get(requestId) as Record<
    string,
    unknown
  >;
  return mapRequest(row);
}

export function listPublicEbookRequests(
  db: DatabaseSync,
  options: { status?: string; limit?: number } = {},
): PublicEbookRequest[] {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const status = options.status;

  let rows: Record<string, unknown>[];
  if (status) {
    rows = db
      .prepare(
        `SELECT * FROM ebook_requests
         WHERE status = ?
         ORDER BY upvote_count DESC, created_at DESC
         LIMIT ?`,
      )
      .all(status, limit) as Record<string, unknown>[];
  } else {
    rows = db
      .prepare(
        `SELECT * FROM ebook_requests
         WHERE status NOT IN ('duplicate', 'closed')
         ORDER BY upvote_count DESC, created_at DESC
         LIMIT ?`,
      )
      .all(limit) as Record<string, unknown>[];
  }

  return rows.map(mapRequest);
}

export function upvoteEbookRequest(
  db: DatabaseSync,
  requestId: string,
  voterKey: string,
): { ok: true; request: PublicEbookRequest; alreadyVoted: boolean } | { ok: false; code: 'not_found' } {
  const existing = db
    .prepare(`SELECT request_id, status FROM ebook_requests WHERE request_id = ?`)
    .get(requestId) as { request_id: string; status: string } | undefined;

  if (!existing) return { ok: false, code: 'not_found' };
  if (existing.status === 'duplicate' || existing.status === 'closed') {
    return { ok: false, code: 'not_found' };
  }

  const prior = db
    .prepare(`SELECT upvote_id FROM request_upvotes WHERE request_id = ? AND voter_key = ?`)
    .get(requestId, voterKey);

  if (!prior) {
    const upvoteId = randomUUID();
    db.prepare(`INSERT INTO request_upvotes (upvote_id, request_id, voter_key) VALUES (?, ?, ?)`).run(
      upvoteId,
      requestId,
      voterKey,
    );
    db.prepare(
      `UPDATE ebook_requests
       SET upvote_count = upvote_count + 1, updated_at = datetime('now')
       WHERE request_id = ?`,
    ).run(requestId);
  }

  const row = db.prepare(`SELECT * FROM ebook_requests WHERE request_id = ?`).get(requestId) as Record<
    string,
    unknown
  >;
  return { ok: true, request: mapRequest(row), alreadyVoted: Boolean(prior) };
}

export function buildVoterKey(email: string | null, ip: string): string {
  if (email) return `email:${email.trim().toLowerCase()}`;
  const digest = createHash('sha256').update(ip, 'utf8').digest('hex').slice(0, 32);
  return `ip:${digest}`;
}
