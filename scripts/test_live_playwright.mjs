import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://ebook-sandy-chi.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\tarik\\.gemini\\antigravity\\brain\\47c22d13-1176-4eea-b24a-44f52fdf3ff6';

async function testLiveProduction() {
  console.log('--- RUNNING PLAYWRIGHT LIVE VERIFICATION ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // 1. Visit Homepage
    console.log('[1/4] Visiting homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
    console.log('Homepage title:', await page.title());

    // 2. Check Trending Section
    console.log('[2/4] Inspecting Trending Section (#trending)...');
    const trendingSection = page.locator('#trending');
    const isVisible = await trendingSection.isVisible();
    console.log('#trending visible:', isVisible);

    if (isVisible) {
      await trendingSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      const trendingShot = path.join(ARTIFACT_DIR, 'live_storefront_trending.png');
      await page.screenshot({ path: trendingShot, fullPage: false });
      console.log('Saved screenshot:', trendingShot);
    }

    // 3. Visit Admin Discovery
    console.log('[3/4] Visiting Admin Discovery Dashboard (/admin/discovery)...');
    await page.goto(`${BASE_URL}/admin/discovery`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const adminShot = path.join(ARTIFACT_DIR, 'live_admin_discovery.png');
    await page.screenshot({ path: adminShot, fullPage: false });
    console.log('Saved screenshot:', adminShot);

    // 4. Verify presence of discovery elements
    const pageText = await page.innerText('body');
    console.log('[4/4] Admin dashboard text verification:');
    console.log('- Contains "Automated Book Discovery":', pageText.includes('Automated Book Discovery'));
    console.log('- Contains "Demand Scoring":', pageText.includes('Demand Scoring'));
    console.log('- Contains "Verified Bestsellers":', pageText.includes('Verified Bestsellers') || pageText.includes('VERIFIED_BESTSELLER'));

  } catch (err) {
    console.error('Playwright Test Error:', err);
  } finally {
    await browser.close();
    console.log('--- PLAYWRIGHT LIVE VERIFICATION FINISHED ---');
  }
}

testLiveProduction();
