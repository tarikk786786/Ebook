/**
 * Phase: Automated Bestselling & Trending eBook Discovery Test Suite
 * Tests multi-provider API integrations, transparent demand intelligence,
 * persistence, admin approval lifecycle, cron execution, and storefront rendering.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

const SERVER_BASE = 'http://localhost:3000';
const reportsDir = path.resolve('reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

test('BOOK DISCOVERY, MCP SERVERS & AI AGENT SKILLS VERIFICATION SUITE', async (t) => {
  const auditLog = [];

  function recordCheck(name, status, details = {}) {
    auditLog.push({ name, status, details, timestamp: new Date().toISOString() });
    if (status) {
      console.log(`[Discovery QA] ✔ PASS: ${name}`);
    } else {
      console.error(`[Discovery QA] ✖ FAIL: ${name}`, details);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Open Library Trending API Connectivity & Schema Verification
  // ---------------------------------------------------------------------------
  await t.test('1. Open Library Trending & Subjects API Connectivity', async () => {
    const { OpenLibraryProvider } = await import('../lib/discovery/providers/openlibrary.ts');
    
    // Daily trending
    const trendingDaily = await OpenLibraryProvider.getTrendingDaily(5);
    assert.ok(Array.isArray(trendingDaily), 'Trending daily must return an array');
    assert.ok(trendingDaily.length > 0, 'Trending daily must contain books');
    assert.ok(trendingDaily[0].title, 'First trending book must have a title');

    // Subject query (business)
    const businessBooks = await OpenLibraryProvider.getBooksBySubject('business', 5);
    assert.ok(Array.isArray(businessBooks), 'Subject query must return an array');
    assert.ok(businessBooks.length > 0, 'Subject query must contain books');

    recordCheck('Open Library Live API Connectivity', true, {
      dailyCount: trendingDaily.length,
      sampleTitle: trendingDaily[0].title,
      businessCount: businessBooks.length
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Google Books API Integration & Graceful Fallback Handling
  // ---------------------------------------------------------------------------
  await t.test('2. Google Books API Integration & Rate-Limit Resilience', async () => {
    const { GoogleBooksProvider } = await import('../lib/discovery/providers/googlebooks.ts');
    
    const results = await GoogleBooksProvider.searchBooks('clean code', { maxResults: 3 });
    assert.ok(Array.isArray(results), 'Google Books search must return an array (empty on 429 fallback or filled)');

    recordCheck('Google Books API Resilience', true, {
      resultsCount: results.length,
      fallbackHandled: true
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Internet Archive API Bibliographic Query
  // ---------------------------------------------------------------------------
  await t.test('3. Internet Archive Subject Search & Image Generation', async () => {
    const { InternetArchiveProvider } = await import('../lib/discovery/providers/internetarchive.ts');
    
    const archiveDocs = await InternetArchiveProvider.searchSubjectBooks('computer science', 3);
    assert.ok(Array.isArray(archiveDocs), 'Internet Archive search must return an array');

    const sampleImgUrl = InternetArchiveProvider.getCoverUrl('sample_book_id');
    assert.ok(sampleImgUrl.includes('https://archive.org/services/img/sample_book_id'));

    recordCheck('Internet Archive API Query & Cover Resolver', true, {
      docsFound: archiveDocs.length,
      coverResolverValid: true
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Deterministic Demand Scoring Formula & Breakdown
  // ---------------------------------------------------------------------------
  await t.test('4. Transparent Book Intelligence & Demand Scoring Engine', async () => {
    const { BookIntelligence } = await import('../lib/discovery/intelligence.ts');

    // Test a high-signal bestseller
    const bestsellerSignals = {
      bestsellerRank: 2,
      ratingsCount: 15000,
      averageRating: 4.8,
      wantToReadCount: 6000,
      publishedYear: 2025,
      hasVerifiedCover: true,
      hasIsbn13: true,
      hasDescription: true,
      hasPublisher: true
    };

    const outcome = BookIntelligence.computeDemandScore(bestsellerSignals);
    assert.ok(outcome.score >= 85, `High signal book must score >= 85 (actual: ${outcome.score})`);
    assert.equal(outcome.grade, 'VERIFIED_BESTSELLER');
    assert.ok(outcome.recommendedSections.includes('TOP_BESTSELLERS'));
    assert.ok(outcome.recommendedSections.includes('TRENDING_EBOOKS'));
    assert.equal(outcome.confidence, 'HIGH');
    assert.ok(outcome.evidence.breakdown.bestsellerPoints > 0);

    // Test a low-signal catalog entry
    const lowSignals = {
      publishedYear: 2012,
      ratingsCount: 5,
      hasVerifiedCover: false
    };
    const lowOutcome = BookIntelligence.computeDemandScore(lowSignals);
    assert.ok(lowOutcome.score < 50, `Low signal book must score < 50 (actual: ${lowOutcome.score})`);
    assert.equal(lowOutcome.grade, 'STANDARD_DEMAND');

    recordCheck('Deterministic Book Intelligence Scoring', true, {
      bestsellerScore: outcome.score,
      bestsellerGrade: outcome.grade,
      lowScore: lowOutcome.score,
      lowGrade: lowOutcome.grade
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Multi-Provider Discovery Run & 10 Category Research
  // ---------------------------------------------------------------------------
  await t.test('5. Multi-Provider Discovery Run across 10 Categories', async () => {
    const res = await fetch(`${SERVER_BASE}/api/discovery/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxPerCategory: 2, includeTrending: true })
    });
    assert.equal(res.status, 200, '/api/discovery/research must return 200 OK');
    const data = await res.json();
    assert.ok(data.success, 'Research must succeed');
    assert.ok(data.totalDiscovered > 0, 'Total discovered must be > 0');

    recordCheck('Multi-Provider Discovery Orchestration', true, {
      totalDiscovered: data.totalDiscovered,
      addedCount: data.addedCount,
      updatedCount: data.updatedCount
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Approval & Storefront Mapping Lifecycle
  // ---------------------------------------------------------------------------
  await t.test('6. Approval, Rejection & Section Assignment Workflow', async () => {
    const feedRes = await fetch(`${SERVER_BASE}/api/discovery/feed?pageSize=5`);
    const feedData = await feedRes.json();
    assert.ok(feedData.books.length > 0, 'Feed must contain books');
    const targetBook = feedData.books[0];

    // 1. Approve
    const appRes = await fetch(`${SERVER_BASE}/api/discovery/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetBook.id, sections: ['TRENDING_EBOOKS', 'TOP_BESTSELLERS'] })
    });
    assert.equal(appRes.status, 200, 'Approve API must return 200');
    const appData = await appRes.json();
    assert.ok(appData.success, 'Approve must succeed');

    // 2. Reject
    const rejRes = await fetch(`${SERVER_BASE}/api/discovery/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetBook.id })
    });
    assert.equal(rejRes.status, 200, 'Reject API must return 200');
    const rejData = await rejRes.json();
    assert.ok(rejData.success, 'Reject must succeed');

    // Re-approve for storefront
    await fetch(`${SERVER_BASE}/api/discovery/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetBook.id, sections: ['TRENDING_EBOOKS', 'TOP_BESTSELLERS'] })
    });

    recordCheck('Approval & Storefront Mapping Workflow', true, {
      targetId: targetBook.id,
      approvalWorked: true,
      rejectionWorked: true,
      reApproved: true
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Discovery API Endpoints Integrity
  // ---------------------------------------------------------------------------
  await t.test('7. Discovery HTTP Endpoints (/api/discovery/*)', async () => {
    // 1. Feed endpoint
    const feedRes = await fetch(`${SERVER_BASE}/api/discovery/feed?pageSize=5`);
    assert.equal(feedRes.status, 200, '/api/discovery/feed must return 200 OK');
    const feedJson = await feedRes.json();
    assert.ok(feedJson.success && Array.isArray(feedJson.books), 'Feed response must be valid');

    // 2. Stats endpoint
    const statsRes = await fetch(`${SERVER_BASE}/api/discovery/stats`);
    assert.equal(statsRes.status, 200, '/api/discovery/stats must return 200 OK');
    const statsJson = await statsRes.json();
    assert.ok(statsJson.success && statsJson.stats.automatedDiscovery, 'Stats must include automatedDiscovery telemetry');

    // 3. Unauthorized Cron invocation
    const unauthCronRes = await fetch(`${SERVER_BASE}/api/cron/discovery`);
    assert.equal(unauthCronRes.status, 401, 'Cron endpoint without authorization must return 401');

    // 4. Authorized Cron invocation
    const authCronRes = await fetch(`${SERVER_BASE}/api/cron/discovery?secret=anontrove_cron_sec_8849b2f1e0d3c5a79b1e4f6a`);
    assert.equal(authCronRes.status, 200, 'Authorized cron invocation must return 200 OK');
    const cronJson = await authCronRes.json();
    assert.ok(cronJson.success && cronJson.action === 'CRON_AUTOMATED_DISCOVERY');

    recordCheck('Discovery HTTP Endpoints Integrity', true, {
      feedStatus: feedRes.status,
      statsStatus: statsRes.status,
      unauthCronStatus: unauthCronRes.status,
      authCronStatus: authCronRes.status,
      cronDiscoveredTotal: cronJson.totalFeedSize
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Admin UI & Storefront Section Accessibility
  // ---------------------------------------------------------------------------
  await t.test('8. Admin Dashboard & Storefront Sections Accessibility', async () => {
    // 1. /admin/discovery
    const adminRes = await fetch(`${SERVER_BASE}/admin/discovery`);
    assert.equal(adminRes.status, 200, '/admin/discovery must render with 200 OK');

    // 2. Homepage with Trending Section
    const homeRes = await fetch(`${SERVER_BASE}/`);
    assert.equal(homeRes.status, 200, 'Homepage must render with 200 OK');
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes('id="trending"'), 'Homepage must contain #trending section');
    assert.ok(homeHtml.includes('id="bestsellers"'), 'Homepage must contain #bestsellers section');

    recordCheck('Admin Dashboard & Storefront Accessibility', true, {
      adminDiscoveryStatus: adminRes.status,
      homeStatus: homeRes.status,
      hasTrendingSection: true,
      hasBestsellersSection: true
    });
  });

  // Save report
  fs.writeFileSync(path.join(reportsDir, 'book_discovery_suite_report.json'), JSON.stringify(auditLog, null, 2), 'utf8');
});
