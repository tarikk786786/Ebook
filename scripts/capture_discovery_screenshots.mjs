import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Capturing Admin Discovery Dashboard...');
  await page.goto('http://localhost:3000/admin/discovery', { waitUntil: 'load', timeout: 25000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.resolve('screenshots/qa/admin_discovery_dashboard.png'), fullPage: false });

  console.log('Capturing Homepage Trending Section...');
  await page.goto('http://localhost:3000/#trending', { waitUntil: 'load', timeout: 25000 });
  await page.waitForTimeout(1500);
  const selector = '#trending';
  const trendingEl = await page.locator(selector).first();
  if ((await trendingEl.count()) > 0) {
    await trendingEl.screenshot({ path: path.resolve('screenshots/qa/storefront_trending_section.png') });
  } else {
    await page.screenshot({ path: path.resolve('screenshots/qa/storefront_trending_section.png'), fullPage: false });
  }

  console.log('All discovery screenshots captured successfully!');
  await browser.close();
})();
