import { randomUUID } from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  contributorSessionExpiresAtIso,
  generateOpaqueAccessToken,
  hashCommunityAccessToken,
  magicLinkExpiresAtIso,
  signRequesterSessionPayload,
} from './auth';
import type { CommunityMagicLinkRequest } from './validation';

export type MagicLinkIssueResult = {
  verifyUrl: string;
  intent: 'contributor' | 'requester';
  email: string;
  expiresAt: string;
};

export function issueCommunityMagicLink(
  db: DatabaseSync,
  input: CommunityMagicLinkRequest,
  origin: string,
): MagicLinkIssueResult {
  const { rawToken, tokenHash } = generateOpaqueAccessToken();
  const magicExpires = magicLinkExpiresAtIso();

  const existing = db
    .prepare(`SELECT id, status FROM contributors WHERE email = ? LIMIT 1`)
    .get(input.email) as { id: string; status: string } | undefined;

  const contributorId = existing?.id ?? randomUUID();
  const statusOnInsert = input.intent === 'contributor' ? 'pending' : existing?.status ?? 'pending';

  if (existing) {
    db.prepare(
      `UPDATE contributors SET
        access_token_hash = ?,
        access_token_expires_at = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
    ).run(tokenHash, magicExpires, contributorId);
  } else {
    db.prepare(
      `INSERT INTO contributors (id, email, status, access_token_hash, access_token_expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(contributorId, input.email, statusOnInsert, tokenHash, magicExpires);
  }

  const returnTo = input.returnTo ? encodeURIComponent(input.returnTo) : '';
  const verifyUrl = `${origin}/api/community/auth/verify?token=${encodeURIComponent(rawToken)}&intent=${input.intent}${returnTo ? `&returnTo=${returnTo}` : ''}`;

  return {
    verifyUrl,
    intent: input.intent,
    email: input.email,
    expiresAt: magicExpires,
  };
}

export function verifyMagicLinkToken(
  db: DatabaseSync,
  rawToken: string,
  intent: 'contributor' | 'requester',
): { ok: true; email: string; sessionToken: string } | { ok: false; reason: 'invalid' | 'expired' } {
  let tokenHash: string;
  try {
    tokenHash = hashCommunityAccessToken(rawToken);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (intent === 'contributor') {
    const row = db
      .prepare(
        `SELECT id, email, access_token_expires_at FROM contributors
         WHERE access_token_hash = ?
         LIMIT 1`,
      )
      .get(tokenHash) as { id: string; email: string; access_token_expires_at: string | null } | undefined;

    if (!row) return { ok: false, reason: 'invalid' };
    const exp = Date.parse(row.access_token_expires_at ?? '');
    if (Number.isNaN(exp) || Date.now() > exp) {
      return { ok: false, reason: 'expired' };
    }

    const sessionExpires = contributorSessionExpiresAtIso();
    db.prepare(
      `UPDATE contributors SET
        status = 'active',
        access_token_hash = ?,
        access_token_expires_at = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
    ).run(tokenHash, sessionExpires, row.id);

    return { ok: true, email: row.email, sessionToken: rawToken };
  }

  const row = db
    .prepare(
      `SELECT email, access_token_expires_at FROM contributors
       WHERE access_token_hash = ?
       LIMIT 1`,
    )
    .get(tokenHash) as { email: string; access_token_expires_at: string | null } | undefined;

  if (!row) return { ok: false, reason: 'invalid' };
  const exp = Date.parse(row.access_token_expires_at ?? '');
  if (Number.isNaN(exp) || Date.now() > exp) {
    return { ok: false, reason: 'expired' };
  }

  const sessionToken = signRequesterSessionPayload(row.email);
  return { ok: true, email: row.email, sessionToken };
}

/** True when outbound email is configured (otherwise dev may log magic URL). */
export function isCommunityEmailDeliveryConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const resend = process.env.RESEND_API_KEY?.trim();
  return Boolean(host || resend);
}
