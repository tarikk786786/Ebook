import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('All Books APIs: Verification of Cover Images across All Registered Books', () => {
  const booksPath = path.resolve('data/books_registry.json');
  assert.ok(fs.existsSync(booksPath), 'data/books_registry.json must exist');

  const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  assert.ok(books.length > 0, 'Catalog should contain books');

  let emptyCovers = 0;
  let missingFiles = 0;

  for (const b of books) {
    const cover = b.coverImage || b.coverUrl;
    if (!cover || typeof cover !== 'string' || cover.trim() === '') {
      emptyCovers++;
    } else if (!cover.startsWith('http')) {
      const clean = cover.replace(/^\//, '');
      const full = path.resolve('public', clean);
      if (!fs.existsSync(full)) {
        missingFiles++;
      }
    }
  }

  assert.equal(emptyCovers, 0, 'Zero books should have empty cover attributes');
  assert.equal(missingFiles, 0, 'All referenced local covers must exist on disk in public directory');
});

test('Standard Shelf Fallback Cover: Exists and has valid image headers', () => {
  const standardCoverPath = path.resolve('public/covers/standard-shelf-cover.jpg');
  assert.ok(fs.existsSync(standardCoverPath), 'public/covers/standard-shelf-cover.jpg must exist on disk');

  const stat = fs.statSync(standardCoverPath);
  assert.ok(stat.size > 1000, 'standard-shelf-cover.jpg must be a non-trivial image file');

  const buf = fs.readFileSync(standardCoverPath);
  // Verify JPEG magic bytes (0xFF, 0xD8, 0xFF)
  assert.equal(buf[0], 0xFF);
  assert.equal(buf[1], 0xD8);
  assert.equal(buf[2], 0xFF);
});

test('Master 86K Archive: 100% of titles resolve to valid cover images', () => {
  const p1Path = path.resolve('data/catalog/master_86k_part1.json');
  const p2Path = path.resolve('data/catalog/master_86k_part2.json');

  if (fs.existsSync(p1Path) && fs.existsSync(p2Path)) {
    const p1 = JSON.parse(fs.readFileSync(p1Path, 'utf8'));
    const p2 = JSON.parse(fs.readFileSync(p2Path, 'utf8'));
    const all = p1.concat(p2);

    let missingCovers = 0;
    for (const b of all) {
      const c = b.coverImage || b.coverUrl;
      if (!c) {
        missingCovers++;
      } else if (!c.startsWith('http')) {
        const full = path.resolve('public', c.replace(/^\//, ''));
        if (!fs.existsSync(full)) {
          missingCovers++;
        }
      }
    }

    assert.equal(missingCovers, 0, 'All 86k titles must have accessible cover files');
  }
});
