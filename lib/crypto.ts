import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Derive a fixed 32-byte key from the secret
function getKey(): Buffer {
  const rawSecret = process.env.DOWNLOAD_ENCRYPTION_SECRET;
  if (!rawSecret || rawSecret.trim().length < 32) {
    throw new Error('[FATAL SECURITY] DOWNLOAD_ENCRYPTION_SECRET environment variable is missing or shorter than 32 characters. Cryptographic operations halted to prevent insecure fallback token generation.');
  }
  const secret = rawSecret.replace(/^\uFEFF/, '').trim();
  return crypto.scryptSync(secret, 'anontrove-salt-v1', 32);
}

export interface DownloadTokenPayload {
  orderId: string;
  bookId: string;
  fileName: string;
  issuedAt: number;
  ttlMs: number;
  maxDownloads?: number;
}

/**
 * Generate an authenticated, encrypted, time-decayed token for downloading.
 * Format: iv.authTag.ciphertext (Base64URL encoded)
 */
export function generateDownloadToken(payload: Partial<DownloadTokenPayload> & { orderId: string; bookId: string; fileName: string }): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM standard 96-bit IV
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const fullPayload: DownloadTokenPayload = {
    orderId: payload.orderId,
    bookId: payload.bookId,
    fileName: payload.fileName,
    issuedAt: payload.issuedAt || Date.now(),
    ttlMs: payload.ttlMs !== undefined ? payload.ttlMs : 15 * 60 * 1000,
    maxDownloads: payload.maxDownloads || 5,
  };

  const jsonStr = JSON.stringify(fullPayload);
  let ciphertext = cipher.update(jsonStr, 'utf8', 'base64url');
  ciphertext += cipher.final('base64url');
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext}`;
}

/**
 * Decrypts and validates the download token.
 * Returns null if tampering detected or if token expired.
 */
export function decryptDownloadToken(tokenString: string): DownloadTokenPayload | null {
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 3) return null;

    const [ivB64, tagB64, ciphertext] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    const payload: DownloadTokenPayload = JSON.parse(decrypted);

    // Validate expiration
    const now = Date.now();
    const issuedAt = payload.issuedAt || 0;
    const ttlMs = payload.ttlMs !== undefined ? payload.ttlMs : 15 * 60 * 1000;
    if (now > (issuedAt + ttlMs)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    // Cryptographic failure (invalid tag, altered ciphertext)
    return null;
  }
}

/**
 * Timing-safe HMAC-SHA256 verification for FamGateway webhooks.
 *
 * Official OpenAPI (v2): signature = HMAC_SHA256(raw_post_body, merchant_api_key)
 * using the Merchant Default API Key as the HMAC secret.
 *
 * Optional FAMGATEWAY_WEBHOOK_SECRET: if set, tried as an alternate secret
 * (for dashboard-provided dedicated webhook secrets). Official default is API key.
 */
export function verifyFamGatewaySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secrets = [
    process.env.FAMGATEWAY_WEBHOOK_SECRET,
    process.env.FAMGATEWAY_API_KEY,
  ]
    .map((s) => (s || '').replace(/^\uFEFF/, '').trim())
    .filter(Boolean);

  // Deduplicate while preserving order
  const uniqueSecrets = [...new Set(secrets)];
  if (uniqueSecrets.length === 0) {
    console.error('[FAMGATEWAY] No FAMGATEWAY_API_KEY / FAMGATEWAY_WEBHOOK_SECRET configured for webhook HMAC');
    return false;
  }

  try {
    const actualBuf = Buffer.from(signatureHeader.trim(), 'utf8');
    for (const secret of uniqueSecrets) {
      const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const expectedBuf = Buffer.from(expectedSig, 'utf8');
      if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
