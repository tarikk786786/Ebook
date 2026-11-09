import https from 'https';

const BASE_URL = 'https://ebook-sandy-chi.vercel.app';
const ADMIN_SECRET = 'anontrove_sec_9942a78f0b1e4c62d5a3b79e180d4f6a9c1e2b4d6f8a0e2';
const CRON_SECRET = 'anontrove_cron_sec_8849b2f1e0d3c5a79b1e4f6a';

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Antigravity-QA-Verifier/1.0',
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

function post(path, body = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Antigravity-QA-Verifier/1.0',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runLiveVerification() {
  console.log('--- STARTING LIVE PRODUCTION VERIFICATION ---');
  console.log('Target Base URL:', BASE_URL);

  // 1. Check Storefront & Trending Anchor
  console.log('\n[1/5] Checking Storefront & Trending Section...');
  const home = await get('/');
  console.log('Status:', home.status);
  console.log('Has #trending anchor or Trending text:', home.body.includes('id="trending"') || home.body.includes('Trending'));

  // 2. Check Discovery Stats
  console.log('\n[2/5] Checking /api/discovery/stats...');
  const statsRes = await get('/api/discovery/stats');
  console.log('Status:', statsRes.status);
  try {
    const stats = JSON.parse(statsRes.body);
    console.log('Stats:', stats);
  } catch(e) {
    console.log('Body:', statsRes.body.slice(0, 200));
  }

  // 3. Check Discovery Feed
  console.log('\n[3/5] Checking /api/discovery/feed?limit=5...');
  const feedRes = await get('/api/discovery/feed?limit=5');
  console.log('Status:', feedRes.status);
  try {
    const feed = JSON.parse(feedRes.body);
    console.log(`Feed count: ${feed.books?.length || 0}, Total: ${feed.total || 0}`);
    if (feed.books && feed.books.length > 0) {
      console.log('Sample Book:', feed.books[0].title, 'Score:', feed.books[0].demandScore, 'Grade:', feed.books[0].demandGrade);
    }
  } catch(e) {
    console.log('Body:', feedRes.body.slice(0, 200));
  }

  // 4. Check Admin Discovery Dashboard
  console.log('\n[4/5] Checking /admin/discovery...');
  const adminRes = await get('/admin/discovery');
  console.log('Status:', adminRes.status);
  console.log('Admin Page loaded correctly:', adminRes.body.includes('Automated Book Discovery') || adminRes.body.includes('Demand Scoring'));

  // 5. Trigger Cron Discovery Run
  console.log('\n[5/5] Triggering /api/cron/discovery with Authorization header...');
  const cronRes = await get('/api/cron/discovery', {
    'Authorization': `Bearer ${CRON_SECRET}`
  });
  console.log('Cron Status:', cronRes.status);
  try {
    const cronData = JSON.parse(cronRes.body);
    console.log('Cron response:', cronData);
  } catch(e) {
    console.log('Cron body:', cronRes.body.slice(0, 300));
  }

  console.log('\n--- LIVE PRODUCTION VERIFICATION COMPLETE ---');
}

runLiveVerification().catch(console.error);
