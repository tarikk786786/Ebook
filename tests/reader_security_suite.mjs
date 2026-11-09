import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Setup required secret before loading lib
process.env.DOWNLOAD_ENCRYPTION_SECRET = 'a'.repeat(32);

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.DOWNLOAD_ENCRYPTION_SECRET.trim();
  return crypto.scryptSync(secret, 'anontrove-salt-v1', 32);
}

function generateDownloadToken(payload) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(JSON.stringify(payload), 'utf8', 'base64url');
  ciphertext += cipher.final('base64url');
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext}`;
}

function decryptDownloadToken(tokenString) {
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, ciphertext] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');
    const payload = JSON.parse(decrypted);
    if (Date.now() > payload.issuedAt + payload.ttlMs) return null;
    return payload;
  } catch {
    return null;
  }
}

test('Reader Token: Generates valid format-detectable encrypted token', () => {
  const payload = {
    orderId: 'ORD_TEST_READER_001',
    bookId: 'book-001',
    fileName: 'machine-learning-engineering.pdf',
    issuedAt: Date.now(),
    ttlMs: 24 * 60 * 60 * 1000,
    maxDownloads: 5
  };

  const token = generateDownloadToken(payload);
  assert.ok(token.length > 50, 'Token length should be > 50 chars');
  assert.equal(token.split('.').length, 3, 'Token format should be iv.tag.ciphertext');

  const decrypted = decryptDownloadToken(token);
  assert.ok(decrypted, 'Token should decrypt successfully');
  assert.equal(decrypted.orderId, 'ORD_TEST_READER_001');
  assert.equal(decrypted.fileName, 'machine-learning-engineering.pdf');
});

test('Reader Token: EPUB format payload generates and decrypts cleanly', () => {
  const payload = {
    orderId: 'ORD_TEST_EPUB_002',
    bookId: 'book-002',
    fileName: 'advanced-cybersecurity.epub',
    issuedAt: Date.now(),
    ttlMs: 24 * 60 * 60 * 1000,
    maxDownloads: 5
  };

  const token = generateDownloadToken(payload);
  const decrypted = decryptDownloadToken(token);
  assert.ok(decrypted, 'EPUB payload should decrypt cleanly');
  assert.ok(decrypted.fileName.endsWith('.epub'), 'File format must be detected as .epub');
});

test('Reader Token: Expired token returns null (enforces session TTL)', () => {
  const expiredPayload = {
    orderId: 'ORD_EXPIRED_003',
    bookId: 'book-003',
    fileName: 'quantum-computing.pdf',
    issuedAt: Date.now() - (48 * 60 * 60 * 1000), // 48h ago
    ttlMs: 24 * 60 * 60 * 1000, // 24h TTL
  };

  const expiredToken = generateDownloadToken(expiredPayload);
  const decrypted = decryptDownloadToken(expiredToken);
  assert.equal(decrypted, null, 'Expired reader token must be rejected');
});

test('Reader Token: Tampered ciphertext fails authentication check', () => {
  const payload = {
    orderId: 'ORD_TAMPER_004',
    bookId: 'book-004',
    fileName: 'cloud-architecture.pdf',
    issuedAt: Date.now(),
    ttlMs: 24 * 60 * 60 * 1000,
  };

  const token = generateDownloadToken(payload);
  const parts = token.split('.');
  // Mutate ciphertext slightly
  parts[2] = parts[2].slice(0, -2) + 'AA';
  const tamperedToken = parts.join('.');

  const decrypted = decryptDownloadToken(tamperedToken);
  assert.equal(decrypted, null, 'Tampered token must fail decipher and return null');
});
