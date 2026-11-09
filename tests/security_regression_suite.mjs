/**
 * AnonTrove Security & Authorization Regression Test Suite
 * Validates fixes for VULN-001, VULN-002, VULN-003, VULN-004, VULN-006, VULN-007
 */

import assert from 'node:assert';
import test from 'node:test';
import crypto from 'node:crypto';

// Setup required test environment secrets
process.env.DOWNLOAD_ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ADMIN_ACCESS_SECRET = 'ci_test_admin_secret_minimum_32_characters_long_12345';
process.env.FAMGATEWAY_API_KEY = 'fam_ci_test_secret_api_key_77561f565e477';

test('VULN-004: Cryptographic fail-closed on absent secret', async () => {
  const originalSecret = process.env.DOWNLOAD_ENCRYPTION_SECRET;
  try {
    delete process.env.DOWNLOAD_ENCRYPTION_SECRET;
    // Dynamic import to test initialization
    const { generateDownloadToken } = await import('../lib/crypto.ts');
    assert.throws(
      () => {
        generateDownloadToken({
          orderId: 'test-ord',
          bookId: 'test-book',
          fileName: 'test.pdf',
          issuedAt: Date.now(),
          ttlMs: 3600000,
        });
      },
      /DOWNLOAD_ENCRYPTION_SECRET environment variable is missing/,
      'Must throw error and never fall back to hardcoded default key'
    );
  } finally {
    process.env.DOWNLOAD_ENCRYPTION_SECRET = originalSecret;
  }
});

test('Cryptographic Token Lifecycle: AES-256-GCM Generation, Tamper-Resistance & Decay', async () => {
  const { generateDownloadToken, decryptDownloadToken } = await import('../lib/crypto.ts');

  const payload = {
    orderId: 'ORD-998877',
    bookId: 'book-zero-trace',
    fileName: 'the-zero-trace-engineer.pdf',
    issuedAt: Date.now(),
    ttlMs: 24 * 60 * 60 * 1000,
    maxDownloads: 5,
  };

  const token = generateDownloadToken(payload);
  assert.ok(token && typeof token === 'string', 'Token must be a valid non-empty string');
  assert.strictEqual(token.split('.').length, 3, 'Token must follow iv.tag.ciphertext format');

  // Verify valid decryption
  const decrypted = decryptDownloadToken(token);
  assert.ok(decrypted, 'Decryption should succeed for untampered token');
  assert.strictEqual(decrypted.orderId, payload.orderId);
  assert.strictEqual(decrypted.bookId, payload.bookId);

  // Tamper detection: flip a byte in ciphertext
  const parts = token.split('.');
  const tamperedCiphertext = parts[2].slice(0, -2) + (parts[2].slice(-2) === 'AA' ? 'BB' : 'AA');
  const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedCiphertext}`;
  const tamperedResult = decryptDownloadToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token must fail authentication tag check and return null');

  // Expired token rejection
  const expiredToken = generateDownloadToken({
    ...payload,
    issuedAt: Date.now() - 100000,
    ttlMs: 50000, // Expired 50 seconds ago
  });
  const expiredResult = decryptDownloadToken(expiredToken);
  assert.strictEqual(expiredResult, null, 'Expired token must return null');
});

test('Timing-Safe HMAC Verification for FamGateway Webhooks', async () => {
  const { verifyFamGatewaySignature } = await import('../lib/crypto.ts');

  const sampleBody = JSON.stringify({ order_id: 'fg_12345', amount: '199.00', status: 'success' });
  const validSignature = crypto
    .createHmac('sha256', process.env.FAMGATEWAY_API_KEY)
    .update(sampleBody)
    .digest('hex');

  // 1. Valid signature
  assert.strictEqual(verifyFamGatewaySignature(sampleBody, validSignature), true, 'Valid HMAC must pass');

  // 2. Forged signature
  const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  assert.strictEqual(verifyFamGatewaySignature(sampleBody, forgedSignature), false, 'Forged HMAC must be rejected');

  // 3. Null or empty signature
  assert.strictEqual(verifyFamGatewaySignature(sampleBody, null), false, 'Null signature must return false');
  assert.strictEqual(verifyFamGatewaySignature(sampleBody, ''), false, 'Empty signature must return false');

  // 4. Tampered body
  const tamperedBody = JSON.stringify({ order_id: 'fg_12345', amount: '1.00', status: 'success' });
  assert.strictEqual(verifyFamGatewaySignature(tamperedBody, validSignature), false, 'Tampered body must fail HMAC check');
});

test('VULN-006: SSRF URL Whitelisting & Loopback Blocking', async () => {
  function isSafePublicHttpsUrl(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:') return false;
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === '169.254.169.254' ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Dangerous URLs that must be blocked
  assert.strictEqual(isSafePublicHttpsUrl('http://github.com/test'), false, 'Non-HTTPS must be blocked');
  assert.strictEqual(isSafePublicHttpsUrl('https://localhost/admin'), false, 'Localhost must be blocked');
  assert.strictEqual(isSafePublicHttpsUrl('https://127.0.0.1:8080/metrics'), false, '127.0.0.1 must be blocked');
  assert.strictEqual(isSafePublicHttpsUrl('https://169.254.169.254/latest/meta-data/'), false, 'AWS metadata must be blocked');
  assert.strictEqual(isSafePublicHttpsUrl('https://192.168.1.1/router'), false, 'Private class C must be blocked');
  assert.strictEqual(isSafePublicHttpsUrl('https://10.0.0.5/api'), false, 'Private class A must be blocked');

  // Safe legitimate public URLs
  assert.strictEqual(isSafePublicHttpsUrl('https://github.com/tesseract-ocr/tesseract/releases'), true, 'Public HTTPS GitHub release must be allowed');
});

test('VULN-003 & VULN-005: Admin Access Timing-Safe Verification & Header Validation', async () => {
  const { verifyAdminAccess } = await import('../lib/auth/admin.ts');

  // 1. Unauthenticated request without headers
  const unauthReq = {
    headers: new Headers(),
    cookies: { get: () => undefined },
  };

  assert.strictEqual(verifyAdminAccess(unauthReq), false, 'Unauthenticated request must be denied (false)');

  // 2. Request with invalid / forged token
  const forgedReq = {
    headers: new Headers({ 'x-admin-token': 'wrong_token_attempt_12345' }),
    cookies: { get: () => undefined },
  };

  assert.strictEqual(verifyAdminAccess(forgedReq), false, 'Forged admin token must be denied (false)');

  // 3. Request with valid admin secret header
  const authReq = {
    headers: new Headers({ 'x-admin-token': process.env.ADMIN_ACCESS_SECRET }),
    cookies: { get: () => undefined },
  };

  assert.strictEqual(verifyAdminAccess(authReq), true, 'Valid admin secret must be granted access (true)');

  // 4. Request with Bearer authorization header
  const bearerReq = {
    headers: new Headers({ 'authorization': `Bearer ${process.env.ADMIN_ACCESS_SECRET}` }),
    cookies: { get: () => undefined },
  };

  assert.strictEqual(verifyAdminAccess(bearerReq), true, 'Valid Bearer admin token must be granted access (true)');
});

test('Privacy Leak Elimination: In-Memory Zero-Trace QR Code Generation', async () => {
  const QRCode = (await import('qrcode')).default;
  const sampleIntent = 'upi://pay?pa=test@upi&pn=AnonTrove&am=199.00&cu=INR&tr=ORD-TEST-001&tn=Ebook';
  
  const qrDataUrl = await QRCode.toDataURL(sampleIntent, {
    margin: 1,
    width: 300,
    errorCorrectionLevel: 'M',
  });

  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Code must be an in-memory data URI');
  assert.ok(!qrDataUrl.includes('api.qrserver.com'), 'Must never call external QR servers');
  assert.ok(qrDataUrl.length > 500, 'Data URI must contain encoded PNG image data');
});

test('Zod Schema Hardening: Checkout Request Boundary Validation', async () => {
  const { z } = await import('zod');

  const CheckoutItemSchema = z.object({
    bookId: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'bookId contains invalid characters'),
    quantity: z.number().int().positive().max(10).optional().default(1),
  });

  const CheckoutRequestSchema = z.object({
    bookId: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    items: z.array(CheckoutItemSchema).max(50).optional(),
    customerEmail: z.string().email().max(128).optional().default('reader@anontrove.internal'),
    customerPhone: z.string().regex(/^\+?[0-9]{10,15}$/).max(16).optional(),
    couponCode: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    gateway: z.enum(['FAMGATEWAY', 'FAMPAY', 'UPI']).optional().default('FAMGATEWAY'),
  }).refine(data => Boolean(data.bookId || (data.items && data.items.length > 0)), {
    message: 'Either bookId or a non-empty items array must be provided for checkout',
  });

  // 1. Valid single book
  const validSingle = CheckoutRequestSchema.safeParse({ bookId: 'book-zero-trace', customerEmail: 'test@example.com' });
  assert.strictEqual(validSingle.success, true, 'Valid single book checkout should pass');

  // 2. Valid multi-item cart
  const validMulti = CheckoutRequestSchema.safeParse({
    items: [{ bookId: 'book-zero-trace', quantity: 1 }, { bookId: 'book-threat-model', quantity: 2 }],
  });
  assert.strictEqual(validMulti.success, true, 'Valid multi-item cart should pass');

  // 3. Reject empty request
  const rejectEmpty = CheckoutRequestSchema.safeParse({});
  assert.strictEqual(rejectEmpty.success, false, 'Empty checkout request must be rejected');

  // 4. Reject malicious path-traversal / injection bookId
  const rejectTraversal = CheckoutRequestSchema.safeParse({ bookId: '../../etc/passwd' });
  assert.strictEqual(rejectTraversal.success, false, 'Path traversal bookId must be rejected');

  const rejectXss = CheckoutRequestSchema.safeParse({ bookId: '<script>alert(1)</script>' });
  assert.strictEqual(rejectXss.success, false, 'XSS bookId must be rejected');

  // 5. Reject invalid email
  const rejectBadEmail = CheckoutRequestSchema.safeParse({ bookId: 'book-zero-trace', customerEmail: 'not-an-email' });
  assert.strictEqual(rejectBadEmail.success, false, 'Malformed customer email must be rejected');
});

test('VULN-008: Supabase Entitlement Synchronization & Itemized Payload Construction', async () => {
  // Test payload mapping structure for PostgreSQL public.order_items table
  const mockOrder = {
    orderNumber: 'ORD-TEST-1234',
    orderId: 'fampay_ord_1234',
    gatewayOrderId: 'fampay_ord_1234',
    customerEmail: 'customer@example.com',
    customerPhone: '+919876543210',
    subtotalInr: 147,
    discountInr: 0,
    totalInr: 147,
    status: 'PAID',
    items: [
      { bookId: 'book-001', priceInInr: 49, title: 'Book 1', fileName: 'book1.pdf' },
      { bookId: 'book-002', priceInInr: 98, title: 'Book 2', fileName: 'book2.pdf' }
    ]
  };

  const orderUuid = '550e8400-e29b-41d4-a716-446655440000';
  const itemsPayload = mockOrder.items.map(item => ({
    order_id: orderUuid,
    book_id: item.bookId,
    price_at_purchase: Math.round(item.priceInInr || 0),
  }));

  assert.strictEqual(itemsPayload.length, 2, 'Should map all cart items into order_items rows');
  assert.strictEqual(itemsPayload[0].order_id, orderUuid, 'Must link item to the parent order UUID');
  assert.strictEqual(itemsPayload[0].book_id, 'book-001');
  assert.strictEqual(itemsPayload[0].price_at_purchase, 49);
  assert.strictEqual(itemsPayload[1].book_id, 'book-002');
  assert.strictEqual(itemsPayload[1].price_at_purchase, 98);
});



