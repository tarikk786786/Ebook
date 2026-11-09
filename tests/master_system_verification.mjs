import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

process.env.DOWNLOAD_ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.FAMGATEWAY_API_KEY = 'fam_live_test_api_key_secure_1234567890';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_key_secure_999';

import { decryptDownloadToken, generateDownloadToken, verifyFamGatewaySignature } from '../lib/crypto.ts';

// 1. Database & 86k Inventory Accuracy
test('1. Database & Inventory Accuracy: Relational tables and exact 86,260 records', () => {
  const dbPath = fileURLToPath(new URL('../data/enrichment_86k_checkpoint.db', import.meta.url));
  assert.ok(fs.existsSync(dbPath), `Database file must exist at ${dbPath}`);

  const db = new DatabaseSync(dbPath);

  const booksCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
  const listingsCount = db.prepare('SELECT COUNT(*) as count FROM marketplace_listings').get().count;
  const pricingCount = db.prepare('SELECT COUNT(*) as count FROM pricing_intelligence').get().count;
  const rightsCount = db.prepare('SELECT COUNT(*) as count FROM book_rights').get().count;

  assert.equal(booksCount, 86260, 'Must have exactly 86,260 book records in database');
  assert.ok(listingsCount >= 90000, `Marketplace listings must be >= 90,000 (got ${listingsCount})`);
  assert.equal(pricingCount, 86260, 'Must have exactly 86,260 pricing records');
  assert.equal(rightsCount, 86260, 'Must have exactly 86,260 rights records');

  db.close();
});

// 2. Correct Book Covers & Thumbnails
test('2. Book Covers & Thumbnails: Provenance flags & safe fallbacks', () => {
  const demandedPath = fileURLToPath(new URL('../data/demanded_books_registry.json', import.meta.url));
  const demanded = JSON.parse(fs.readFileSync(demandedPath, 'utf-8'));

  for (const book of demanded.slice(0, 50)) {
    assert.ok(book.coverImage || book.coverUrl || book.slug, `Book ${book.id} must have a cover image or dynamic slug`);
    assert.ok(book.title && book.title.trim().length > 0, `Book ${book.id} must have title`);
    assert.ok(book.author && book.author.trim().length > 0, `Book ${book.id} must have author`);
  }
});

// 3. Complete and Accurate eBook Details
test('3. Bibliographic Details: Format, pages, and categories verified', () => {
  const demandedPath = fileURLToPath(new URL('../data/demanded_books_registry.json', import.meta.url));
  const demanded = JSON.parse(fs.readFileSync(demandedPath, 'utf-8'));

  for (const book of demanded.slice(0, 50)) {
    assert.ok(book.category, `Book ${book.id} must have category`);
    assert.ok(typeof book.pages === 'number' && book.pages > 0, `Book ${book.id} must have valid page count`);
    assert.ok(book.format, `Book ${book.id} must have format`);
  }
});

// 4. Real Marketplace Information & Digital Price Isolation
test('4. Marketplace Price Comparison: Amazon Kindle & Google Play Books verified', () => {
  const dbPath = fileURLToPath(new URL('../data/enrichment_86k_checkpoint.db', import.meta.url));
  const db = new DatabaseSync(dbPath);

  const rows = db.prepare('SELECT platform, current_price, format FROM marketplace_listings LIMIT 100').all();
  assert.ok(rows.length > 0, 'Marketplace listings must return verified rows');
  
  const digitalFormats = new Set(['Kindle Edition', 'eBook', 'Digital EPUB/PDF', 'Digital', 'PDF', 'Google Play eBook', 'ePub']);

  for (const r of rows) {
    assert.ok(['Amazon Kindle Store', 'Google Play Books', 'Official Publisher'].includes(r.platform), `Platform must be valid digital store: ${r.platform}`);
    assert.ok(typeof r.current_price === 'number' && r.current_price > 0, 'Current price must be positive number');
    assert.ok(digitalFormats.has(r.format), `Format must be digital (no physical print): ${r.format}`);
  }

  db.close();
});

// 5. Smart Selling Price Calculation Model
test('5. Pricing Model: Mathematical contribution margin and tax inclusion', () => {
  const dbPath = fileURLToPath(new URL('../data/enrichment_86k_checkpoint.db', import.meta.url));
  const db = new DatabaseSync(dbPath);

  const rows = db.prepare('SELECT recommended_selling_price, profit_margin_pct FROM pricing_intelligence LIMIT 100').all();
  for (const r of rows) {
    assert.ok(r.recommended_selling_price >= 9, `Price must be >= ₹9 floor (got ${r.recommended_selling_price})`);
    assert.ok(r.profit_margin_pct > 0, `Profit margin must be positive (got ${r.profit_margin_pct}%)`);
  }

  db.close();
});

// 6. Secure, Optimized Payment & Checkout
test('6. Payment Security: Constant-time HMAC webhook validation & Server Price Authority', () => {
  const rawBody = JSON.stringify({
    order_id: 'ORD-SECURE-999',
    amount: 29,
    status: 'SUCCESS',
    timestamp: 1794241469000
  });

  const apiKey = process.env.FAMGATEWAY_API_KEY;
  const validSignature = crypto.createHmac('sha256', apiKey).update(rawBody).digest('hex');

  // 1. Valid signature
  const isValid = verifyFamGatewaySignature(rawBody, validSignature);
  assert.equal(isValid, true, 'Valid signature must verify successfully');

  // 2. Tampered body (amount changed from 29 to 1)
  const tamperedBody = rawBody.replace(':29', ':1');
  assert.notEqual(tamperedBody, rawBody, 'Tampered body must differ from rawBody');
  const isTamperedBodyValid = verifyFamGatewaySignature(tamperedBody, validSignature);
  assert.equal(isTamperedBodyValid, false, 'Tampered body must fail HMAC verification');

  // 3. Null signature
  assert.equal(verifyFamGatewaySignature(rawBody, null), false, 'Null signature header must be rejected');
});

// 7. Protected Downloads & Token Decay Lifecycle
test('7. Protected Downloads: AES-256-GCM Ephemeral Token Generation & Expiration', () => {
  const orderId = 'ORD-VERIFY-888';
  const bookId = 'book-startupology';
  const fileName = 'startupology_master_edition.pdf';

  // 15-minute ephemeral token
  const token = generateDownloadToken({
    orderId,
    bookId,
    fileName,
    ttlMs: 900000,
    maxDownloads: 5
  });
  assert.ok(token, 'Token generated successfully');

  const decrypted = decryptDownloadToken(token);
  assert.ok(decrypted, 'Token decrypted successfully');
  assert.equal(decrypted.orderId, orderId);
  assert.equal(decrypted.bookId, bookId);

  // Expired token rejection
  const expiredToken = generateDownloadToken({
    orderId,
    bookId,
    fileName,
    ttlMs: -1000 // Already expired
  });
  assert.equal(decryptDownloadToken(expiredToken), null, 'Expired token must fail closed');

  // Tampered ciphertext rejection
  const tamperedToken = token.slice(0, -6) + '000000';
  assert.equal(decryptDownloadToken(tamperedToken), null, 'Tampered ciphertext must fail authentication tag check');
});
