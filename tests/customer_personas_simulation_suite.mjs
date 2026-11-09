import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

const BASE_URL = 'https://ebook-sandy-chi.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\tarik\\.gemini\\antigravity\\brain\\47c22d13-1176-4eea-b24a-44f52fdf3ff6';

test('CUSTOMER PERSONAS SIMULATION & AUTOMATED E2E VERIFICATION SUITE', async (t) => {
  let browser;
  let desktopContext;
  let mobileContext;

  t.before(async () => {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    });
  });

  t.after(async () => {
    if (browser) await browser.close();
  });

  // PERSONA 1: First-time visitor
  await t.test('Persona 1: First-Time Visitor (Landing, Discovery, Search & Navigation)', async () => {
    const page = await desktopContext.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      assert.ok(title.includes('AnonTrove') || title.includes('Ebook'), `Title mismatch: ${title}`);

      // Verify header & brand logo
      const brandLogo = page.locator('text=AnonTrove').first();
      assert.ok(await brandLogo.isVisible(), 'Brand logo should be visible');

      // Scroll to Trending Section (#trending)
      const trending = page.locator('#trending').first();
      if (await trending.isVisible()) {
        await trending.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }

      // Check search input presence
      const searchInputs = page.locator('input[type="text"], input[placeholder*="search" i]');
      assert.ok((await searchInputs.count()) > 0, 'Search input should exist on page');

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'persona1_first_time_visitor.png') });
    } finally {
      await page.close();
    }
  });

  // PERSONA 2: Category Browser & Product Reader
  await t.test('Persona 2: Category Explorer & Product Details Reader', async () => {
    const page = await desktopContext.newPage();
    try {
      // Direct navigation to product details
      await page.goto(`${BASE_URL}/book/master-bundle`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Verify book details content
      const content = await page.innerText('body');
      assert.ok(content.toLowerCase().includes('bundle') || content.toLowerCase().includes('master'), 'Should show product details');

      // Verify price presence
      assert.ok(content.includes('₹') || content.includes('INR') || content.includes('49') || content.includes('199'), 'Should show price');

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'persona2_book_details.png') });
    } finally {
      await page.close();
    }
  });

  // PERSONA 3: Mobile Customer (Responsive UX & Touch Targets)
  await t.test('Persona 3: Mobile Shopper (iPhone 14 Viewport & Adaptive Layout)', async () => {
    const page = await mobileContext.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Verify responsive viewport
      const viewport = page.viewportSize();
      assert.equal(viewport?.width, 390);

      // Verify no horizontal page overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.ok(scrollWidth <= clientWidth + 5, `Horizontal overflow detected: ${scrollWidth} > ${clientWidth}`);

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'persona3_mobile_shopper.png') });
    } finally {
      await page.close();
    }
  });

  // PERSONA 4: Customer Checkout & UPI Intent Generation
  await t.test('Persona 4: Checkout Customer (Dynamic UPI Intent Generation)', async () => {
    // Test API intent generation directly against live production
    const payload = JSON.stringify({
      bookId: 'book-master-bundle',
      customerEmail: 'qa-persona4@anontrove.internal'
    });

    const res = await new Promise((resolve, reject) => {
      const req = https.request(new URL('/api/checkout', BASE_URL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, r => {
        let body = '';
        r.on('data', c => body += c);
        r.on('end', () => resolve({ status: r.statusCode, body }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    assert.equal(res.status, 200, `Expected 200 OK from checkout API, got ${res.status}`);
    const json = JSON.parse(res.body);
    const order = json.data || json;
    assert.ok(order.orderId || order.order_id || order.id, 'Checkout response must return orderId');
    assert.ok(order.paymentUrl || order.upiUrl || order.upiIntent || order.qrCode || order.checkoutUrl, 'Must provide UPI/payment details');
    console.log('   -> Verified live UPI intent:', order.upiIntent ? order.upiIntent.slice(0, 45) + '...' : order.checkoutUrl);
  });

  // PERSONA 5: Unsuccessful / Cancelled Payment Simulation
  await t.test('Persona 5: Payment Exception & Order Status Polling', async () => {
    // Query order status with invalid/pending order ID
    const fakeOrderId = 'ORD_FAKE_TEST_' + Date.now();
    const res = await new Promise((resolve) => {
      https.get(new URL(`/api/order/status?orderId=${fakeOrderId}`, BASE_URL), (r) => {
        let body = '';
        r.on('data', c => body += c);
        r.on('end', () => resolve({ status: r.statusCode, body }));
      }).on('error', () => resolve({ status: 500, body: '' }));
    });

    // Should return 404 or safe status without leaking internal trace
    assert.ok(res.status === 404 || res.status === 400 || res.status === 200, `Expected safe status, got ${res.status}`);
    if (res.body) {
      assert.ok(!res.body.includes('stacktrace') && !res.body.includes('SECRET'), 'Must not leak sensitive stack traces');
    }
  });

  // PERSONA 6: Security Attacker Attempting Unauthorized Download Token Forging
  await t.test('Persona 6: Adversary Attempting Unauthorized Download (Tampered Token Protection)', async () => {
    // 1. Invalid signature token via direct dynamic path
    const forgedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGVzdCJ9.invalid_signature_tag';
    const res1 = await new Promise((resolve) => {
      https.get(new URL(`/api/download/${forgedToken}`, BASE_URL), (r) => {
        resolve(r.statusCode);
      }).on('error', () => resolve(500));
    });
    assert.ok(res1 === 401 || res1 === 403 || res1 === 400, `Forged token must be rejected: got ${res1}`);

    // 2. Path traversal attack attempt
    const traversalToken = encodeURIComponent('../../etc/passwd');
    const res2 = await new Promise((resolve) => {
      https.get(new URL(`/api/download/${traversalToken}`, BASE_URL), (r) => {
        resolve(r.statusCode);
      }).on('error', () => resolve(500));
    });
    assert.ok(res2 === 401 || res2 === 403 || res2 === 400, `Path traversal token must be rejected: got ${res2}`);
    console.log(`   -> Cryptographic verification rejected forged token with HTTP ${res1} and traversal with HTTP ${res2}`);
  });

  // PERSONA 7: Admin Researcher Managing Discovery Feed
  await t.test('Persona 7: Admin Portal Researcher (Discovery Workflow & Live Feed)', async () => {
    const page = await desktopContext.newPage();
    try {
      await page.goto(`${BASE_URL}/admin/discovery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Verify Admin Discovery loaded
      const body = await page.innerText('body');
      assert.ok(body.includes('Bestsellers') || body.includes('Discovery') || body.includes('Research') || body.includes('Catalog'), 'Admin dashboard should load');

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'persona7_admin_discovery.png') });
    } finally {
      await page.close();
    }
  });
});
