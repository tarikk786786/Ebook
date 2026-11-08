import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Validates admin authorization from incoming Next.js API requests.
 * Uses timing-safe string comparison to protect against side-channel timing attacks.
 */
export function verifyAdminAccess(req: NextRequest): boolean {
  const configuredSecret = process.env.ADMIN_ACCESS_SECRET;

  // In production, an empty ADMIN_ACCESS_SECRET must reject all access
  if (!configuredSecret || configuredSecret.trim().length < 16) {
    // If not configured, block unauthorized remote access
    console.warn('[ADMIN AUTH] ADMIN_ACCESS_SECRET is not configured or too short (min 16 chars). Denying access.');
    return false;
  }

  // 1. Check x-admin-token header
  let candidateToken = req.headers.get('x-admin-token');

  // 2. Check Authorization Bearer header
  if (!candidateToken) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      candidateToken = authHeader.substring(7).trim();
    }
  }

  // 3. Check admin_session cookie
  if (!candidateToken) {
    candidateToken = req.cookies.get('admin_session')?.value || null;
  }

  if (!candidateToken) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(configuredSecret.trim(), 'utf8');
    const actualBuf = Buffer.from(candidateToken.trim(), 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (e) {
    return false;
  }
}
