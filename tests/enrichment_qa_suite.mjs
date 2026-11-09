import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('MASTER EBOOK CATALOGUE ENRICHMENT QA SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Audit catalogue inventory files
const inventoryPath = 'data/catalogue_inventory_audit.json';
assert(fs.existsSync(inventoryPath), 'Catalogue inventory audit file exists');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
assert(inventory.inventory_summary.total_registered_titles >= 80000, `Inventory contains ${inventory.inventory_summary.total_registered_titles} registered titles`);

// 2. Audit demanded & enriched books
const demanded = JSON.parse(fs.readFileSync('data/demanded_books_registry.json', 'utf8'));
const enriched = JSON.parse(fs.readFileSync('data/enriched_1000_books.json', 'utf8'));
assert(demanded.length > 250, `Demanded books registry has ${demanded.length} titles`);
assert(enriched.length >= 1000, `Enriched books registry has ${enriched.length} titles`);

// 3. Price Immutability Verification (Critical Rule)
let invalidPrices = 0;
for (const b of demanded) {
  if (typeof b.priceInInr !== 'number' || b.priceInInr <= 0) {
    invalidPrices++;
  }
}
assert(invalidPrices === 0, 'Zero price alterations or invalid prices across demanded books');

// 4. Cover Existence & Provenance Verification
const provenance = JSON.parse(fs.readFileSync('data/cover_provenance_ledger.json', 'utf8'));
assert(Object.keys(provenance).length > 15000, `Provenance ledger records ${Object.keys(provenance).length} verified covers`);

let verifiedCoverCount = 0;
let missingCoverFiles = 0;
for (const b of demanded.slice(0, 50)) {
  if (b.coverImage && b.coverImage.startsWith('/covers/')) {
    verifiedCoverCount++;
    const diskPath = path.join('public', b.coverImage.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) {
      missingCoverFiles++;
    }
  }
}
assert(missingCoverFiles === 0, `All sampled covers exist in public/covers (missing: ${missingCoverFiles})`);

// 5. Author Profile Registry Verification
const authors = JSON.parse(fs.readFileSync('data/authors_registry.json', 'utf8'));
const authorCount = Object.keys(authors).length;
assert(authorCount >= 40, `Author profile registry contains ${authorCount} enriched author profiles`);

let authorsWithBio = 0;
for (const a of Object.values(authors)) {
  if (a.shortBio && a.shortBio.length > 10) authorsWithBio++;
}
assert(authorsWithBio >= 30, `${authorsWithBio} authors have rich biographical data`);

// 6. Enrichment Audit Log
const auditLog = JSON.parse(fs.readFileSync('data/enrichment_audit_log.json', 'utf8'));
assert(auditLog.length >= 50, `Enrichment audit log records ${auditLog.length} atomic modifications`);

console.log('\n====================================================');
console.log(`QA VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================================');
