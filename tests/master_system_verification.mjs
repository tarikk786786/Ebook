import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DOWNLOAD_ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

import { BOOK_CATALOG, TOTAL_MAPPED_DOCUMENTS, getEffectiveRightsStatus } from '../lib/catalog.ts';
import { decryptDownloadToken, generateDownloadToken } from '../lib/crypto.ts';

test('1. Catalogue Authoritative Source of Truth', () => {
  assert.ok(Array.isArray(BOOK_CATALOG), 'BOOK_CATALOG must be an array');
  assert.ok(BOOK_CATALOG.length > 1000, `Catalog must contain verified inventory (got ${BOOK_CATALOG.length})`);
  assert.equal(TOTAL_MAPPED_DOCUMENTS, 86337, 'TOTAL_MAPPED_DOCUMENTS must be 86337');

  // Verify no duplicate IDs or NaN prices
  const seenIds = new Set();
  for (const book of BOOK_CATALOG) {
    assert.ok(book.id, 'Every book must have an ID');
    assert.ok(book.title, `Book ${book.id} must have a title`);
    assert.ok(typeof book.priceInInr === 'number' && !isNaN(book.priceInInr) && book.priceInInr > 0, `Book ${book.id} must have valid positive price`);
    assert.ok(!seenIds.has(book.id), `Book ID duplicate detected: ${book.id}`);
    seenIds.add(book.id);
  }
});

test('2. Copyright & Rights Classification Integrity', () => {
  const validStatuses = new Set([
    'RIGHTS_CONFIRMED',
    'PUBLIC_DOMAIN_VERIFIED',
    'OPEN_LICENCE_VERIFIED',
    'PERMISSION_REQUIRED',
    'RIGHTS_UNKNOWN',
    'RIGHTS_REVIEW_REQUIRED'
  ]);

  for (const book of BOOK_CATALOG.slice(0, 100)) {
    const status = getEffectiveRightsStatus(book);
    assert.ok(validStatuses.has(status), `Invalid status ${status} on book ${book.id}`);
  }
});

test('3. Token Lifecycle & Quarantined Security Boundary', () => {
  const orderId = 'ORD-TEST-999999';
  const bookId = 'book-android-hackers-handbook';
  const fileName = 'test.pdf';

  const token = generateDownloadToken({
    orderId,
    bookId,
    fileName,
    ttlMs: 3600000,
    maxDownloads: 5
  });

  assert.ok(token, 'Token generated');
  const decrypted = decryptDownloadToken(token);
  assert.ok(decrypted, 'Token decrypted');
  assert.equal(decrypted.orderId, orderId);
  assert.equal(decrypted.bookId, bookId);

  // Expired token test
  const expiredToken = generateDownloadToken({
    orderId,
    bookId,
    fileName,
    ttlMs: -1000, // already expired
  });
  const decryptedExpired = decryptDownloadToken(expiredToken);
  assert.equal(decryptedExpired, null, 'Expired token must decrypt to null');

  // Tampered token test
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const decryptedTampered = decryptDownloadToken(tamperedToken);
  assert.equal(decryptedTampered, null, 'Tampered token must fail integrity check');
});
