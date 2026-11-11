import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { DatabaseSync } from 'node:sqlite';
import type { ContributorRow } from './types';

/** httpOnly session cookies for community flows (contributor + requester email sessions). */
export const CONTRIBUTOR_SESSION_COOKIE = 'community_contributor_session';
export const REQUESTER_SESSION_COOKIE = 'community_requester_session';
/** Short-lived cookie set only during magic-link verification handoff (optional). */
export const MAGIC_LINK_HANDOFF_COOKIE = 'community_magic_handoff';

/** Default contributor session lifetime after magic-link verify (30 days). */
export const CONTRIBUTOR_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Magic-link token lifetime before verify (15 minutes). */
export const MAGIC_LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

export class CommunityAuthNotConfiguredError extends Error {
  constructor(message = 'COMMUNITY_ACCESS_TOKEN_SECRET is missing or too short (min 32 chars)') {
    super(message);
    this.name = 'CommunityAuthNotConfiguredError';
  }
}

function getCommunityTokenSecret(): string {
  const secret = process.env.COMMUNITY_ACCESS_TOKEN_SECRET?.replace(/^\uFEFF/, '').trim();
  if (!secret || secret.length < 32) {
    throw new CommunityAuthNotConfiguredError();
  }
  return secret;
}

/**
 * One-way hash for opaque access tokens stored on `contributors.access_token_hash`.
 */
export function hashCommunityAccessToken(rawToken: string): string {
  const secret = getCommunityTokenSecret();
  return crypto.createHmac('sha256', secret).update(rawToken, 'utf8').digest('hex');
}

export function generateOpaqueAccessToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: hashCommunityAccessToken(rawToken) };
}

export function contributorSessionExpiresAtIso(ttlMs: number = CONTRIBUTOR_SESSION_TTL_MS): string {
  return new Date(Date.now() + ttlMs).toISOString();
}

export function magicLinkExpiresAtIso(ttlMs: number = MAGIC_LINK_TOKEN_TTL_MS): string {
  return new Date(Date.now() + ttlMs).toISOString();
}

export function isAccessTokenExpired(expiresAtIso: string | null | undefined): boolean {
  if (!expiresAtIso) return true;
  const t = Date.parse(expiresAtIso);
  if (Number.isNaN(t)) return true;
  return Date.now() > t;
}

export type ContributorSessionCookieOptions = {
  maxAgeSeconds?: number;
  secure?: boolean;
};

/**
 * Cookie attributes for contributor/requester httpOnly sessions.
 */
export function buildCommunitySessionCookieOptions(
  options: ContributorSessionCookieOptions = {},
): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  const maxAge = options.maxAgeSeconds ?? Math.floor(CONTRIBUTOR_SESSION_TTL_MS / 1000);
  const secure =
    options.secure !== undefined
      ? options.secure
      : process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

function mapContributorRow(row: Record<string, unknown>): ContributorRow {
  return {
    id: String(row.id),
    email: String(row.email),
    display_name: row.display_name != null ? String(row.display_name) : null,
    upi_id: row.upi_id != null ? String(row.upi_id) : null,
    upi_verified_at: row.upi_verified_at != null ? String(row.upi_verified_at) : null,
    status: row.status as ContributorRow['status'],
    access_token_hash: row.access_token_hash != null ? String(row.access_token_hash) : null,
    access_token_expires_at:
      row.access_token_expires_at != null ? String(row.access_token_expires_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Resolves contributor from httpOnly session cookie (timing-safe hash compare via DB lookup).
 */
export function verifyContributorSession(
  req: NextRequest,
  db: DatabaseSync,
): ContributorRow | null {
  const raw = req.cookies.get(CONTRIBUTOR_SESSION_COOKIE)?.value?.trim();
  if (!raw) return null;

  let tokenHash: string;
  try {
    tokenHash = hashCommunityAccessToken(raw);
  } catch {
    return null;
  }

  const row = db
    .prepare(
      `SELECT * FROM contributors
       WHERE access_token_hash = ?
         AND status = 'active'
       LIMIT 1`,
    )
    .get(tokenHash) as Record<string, unknown> | undefined;

  if (!row) return null;

  if (isAccessTokenExpired(row.access_token_expires_at as string | null)) {
    return null;
  }

  return mapContributorRow(row);
}

/**
 * Requester sessions use the same opaque token pattern but are keyed by email in `recipient_key`
 * flows later; this helper only validates cookie presence + HMAC-bound email payload.
 */
export function signRequesterSessionPayload(email: string, ttlMs: number = CONTRIBUTOR_SESSION_TTL_MS): string {
  const secret = getCommunityTokenSecret();
  const exp = Date.now() + ttlMs;
  const payload = JSON.stringify({ email: email.trim().toLowerCase(), exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64, 'utf8').digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyRequesterSessionToken(token: string): { email: string } | null {
  try {
    const secret = getCommunityTokenSecret();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expected = crypto.createHmac('sha256', secret).update(payloadB64, 'utf8').digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!payload.email || !payload.exp || Date.now() > payload.exp) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function verifyRequesterSession(req: NextRequest): { email: string } | null {
  const raw = req.cookies.get(REQUESTER_SESSION_COOKIE)?.value?.trim();
  if (!raw) return null;
  return verifyRequesterSessionToken(raw);
}
