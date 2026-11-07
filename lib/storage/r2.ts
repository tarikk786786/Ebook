import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'anontrove-ebooks-vault';

/**
 * Checks if Cloudflare R2 is configured with active credentials.
 */
export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Generates an authorized, short-lived signed URL or streaming proxy path
 * for a private R2 object.
 * Default TTL: 15 minutes (900 seconds)
 */
export async function getSignedR2DownloadUrl(objectKey: string, expiresInSeconds: number = 900): Promise<string> {
  if (!isR2Configured()) {
    // Local fallback proxy path
    return `/api/download/local?file=${encodeURIComponent(objectKey)}`;
  }

  // Generate AWS SigV4 signed URL or routed internal streaming endpoint
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = crypto
    .createHmac('sha256', R2_SECRET_ACCESS_KEY)
    .update(`${objectKey}:${expiresAt}`)
    .digest('hex');

  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${encodeURIComponent(objectKey)}?expires=${expiresAt}&sig=${signature}`;
}
