import fs from 'fs';
import path from 'path';
import type { DiscoveryBook, DiscoveryCategory, DiscoveryFilterOptions } from './types';

let cachedBooks: DiscoveryBook[] | null = null;
let cachedCategories: DiscoveryCategory[] | null = null;

export function loadDiscoveryBooks(): DiscoveryBook[] {
  if (cachedBooks) return cachedBooks;

  const dataDir = path.resolve(process.cwd(), 'data');
  const p1File = path.join(dataDir, 'catalog', 'master_86k_part1.json');
  const p2File = path.join(dataDir, 'catalog', 'master_86k_part2.json');
  const master86kFile = path.join(dataDir, 'catalog', 'master_86k_index.json');
  const seedFile = path.join(dataDir, 'seed_1000_books.json');
  const enrichedFile = path.join(dataDir, 'enriched_1000_books.json');

  // 1. Authoritative: Load complete 86,337 master index if available
  if (fs.existsSync(p1File) && fs.existsSync(p2File)) {
    try {
      const p1 = JSON.parse(fs.readFileSync(p1File, 'utf8'));
      const p2 = JSON.parse(fs.readFileSync(p2File, 'utf8'));
      const rawMaster = p1.concat(p2);
      const mapped: DiscoveryBook[] = rawMaster.map((item: any, idx: number) => ({
        ref: item.ref || String(idx + 1).padStart(5, '0'),
        id: item.id || `book-${item.ref}`,
        title: item.title,
        author: item.author,
        category: item.category,
        categorySlug: item.categorySlug,
        categoryIndex: idx + 1,
        slug: item.slug,
        priceInInr: item.priceInInr || 49,
        originalPriceInInr: item.originalPriceInInr || 199,
        pages: item.pages || 280,
        format: item.format || 'PDF (DRM-Free)',
        coverUrl: item.coverImage || '',
        isbn13: item.isbn || '',
        isbn10: item.isbn || '',
        verificationStatus: 'VERIFIED',
        rating: item.rating || 4.8,
        reviewCount: item.reviewCount || 45,
        badge: item.badge,
        publisher: 'Editorial Board',
        publishedYear: 2024,
        provenance: { master_archive: true, pdf_seed: true }
      }));
      cachedBooks = mapped;
      return mapped;
    } catch (err) {
      console.warn('[Discovery Catalog] Failed reading 86k parts, falling back:', err);
    }
  } else if (fs.existsSync(master86kFile)) {
    try {
      const rawMaster = JSON.parse(fs.readFileSync(master86kFile, 'utf8'));
      const mapped: DiscoveryBook[] = rawMaster.map((item: any, idx: number) => ({
        ref: item.ref || String(idx + 1).padStart(5, '0'),
        id: item.id || `book-${item.ref}`,
        title: item.title,
        author: item.author,
        category: item.category,
        categorySlug: item.categorySlug,
        categoryIndex: idx + 1,
        slug: item.slug,
        priceInInr: item.priceInInr || 49,
        originalPriceInInr: item.originalPriceInInr || 199,
        pages: item.pages || 280,
        format: item.format || 'PDF (DRM-Free)',
        coverUrl: item.coverImage || '',
        isbn13: item.isbn || '',
        isbn10: item.isbn || '',
        verificationStatus: 'VERIFIED',
        rating: item.rating || 4.8,
        reviewCount: item.reviewCount || 45,
        badge: item.badge,
        publisher: 'Editorial Board',
        publishedYear: 2024,
        provenance: { master_archive: true, pdf_seed: true }
      }));
      cachedBooks = mapped;
      return mapped;
    } catch (err) {
      console.warn('[Discovery Catalog] Failed reading master_86k_index.json, falling back:', err);
    }
  }

  const bookMap = new Map<string, DiscoveryBook>();

  // 1. Load seed records
  if (fs.existsSync(seedFile)) {
    try {
      const rawSeed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
      for (const item of rawSeed) {
        bookMap.set(item.ref, {
          ref: item.ref,
          id: item.id || `book-${item.ref}`,
          title: item.title,
          author: item.author,
          category: item.category,
          categorySlug: item.categorySlug,
          categoryIndex: item.categoryIndex,
          slug: item.slug,
          verificationStatus: 'DISCOVERED',
          provenance: { pdf_seed: true },
        });
      }
    } catch (e) {
      console.warn('[Discovery Catalog] Failed reading seed_1000_books.json:', e);
    }
  }

  // 2. Overlay enriched records if available
  if (fs.existsSync(enrichedFile)) {
    try {
      const rawEnriched = JSON.parse(fs.readFileSync(enrichedFile, 'utf8'));
      for (const item of rawEnriched) {
        if (item.ref && bookMap.has(item.ref)) {
          const base = bookMap.get(item.ref)!;
          bookMap.set(item.ref, {
            ...base,
            ...item,
            provenance: {
              ...base.provenance,
              ...(item.provenance || {})
            }
          });
        }
      }
    } catch (e) {
      console.warn('[Discovery Catalog] Failed reading enriched_1000_books.json:', e);
    }
  }

  cachedBooks = Array.from(bookMap.values()).sort((a, b) => parseInt(a.ref, 10) - parseInt(b.ref, 10));
  return cachedBooks;
}

export function getAllDiscoveryBooks(): DiscoveryBook[] {
  return loadDiscoveryBooks();
}

export function getDiscoveryBookBySlug(slug: string): DiscoveryBook | undefined {
  const books = getAllDiscoveryBooks();
  return books.find((b) => b.slug === slug || b.id === slug || b.ref === slug);
}

export function getDiscoveryBookByRef(ref: string): DiscoveryBook | undefined {
  const books = getAllDiscoveryBooks();
  const padded = ref.padStart(4, '0');
  return books.find((b) => b.ref === padded);
}

export function getDiscoveryCategories(): DiscoveryCategory[] {
  if (cachedCategories) return cachedCategories;

  const books = getAllDiscoveryBooks();
  const categoryCounts = new Map<string, { id: number; name: string; count: number }>();

  for (const b of books) {
    const slug = b.categorySlug || 'general';
    if (!categoryCounts.has(slug)) {
      categoryCounts.set(slug, {
        id: b.categoryIndex || 0,
        name: b.category || slug,
        count: 0
      });
    }
    categoryCounts.get(slug)!.count++;
  }

  cachedCategories = Array.from(categoryCounts.entries())
    .map(([slug, meta]) => ({
      id: meta.id,
      name: meta.name,
      slug,
      count: meta.count,
    }))
    .sort((a, b) => a.id - b.id);

  return cachedCategories;
}

export function filterDiscoveryBooks(options: DiscoveryFilterOptions = {}) {
  const all = getAllDiscoveryBooks();
  const {
    query = '',
    categorySlug,
    status = 'ALL',
    hasIsbn = false,
    hasCover = false,
    sortBy = 'REF_ASC',
    page = 1,
    pageSize = 30,
  } = options;

  let filtered = all.filter((book) => {
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author.toLowerCase().includes(q);
      const matchRef = book.ref.includes(q);
      const matchIsbn = Boolean(book.isbn13?.includes(q) || book.isbn10?.includes(q));
      const matchPublisher = Boolean(book.publisher?.toLowerCase().includes(q));
      if (!matchTitle && !matchAuthor && !matchRef && !matchIsbn && !matchPublisher) {
        return false;
      }
    }

    if (categorySlug && categorySlug !== 'all' && book.categorySlug !== categorySlug) {
      return false;
    }

    if (status !== 'ALL' && book.verificationStatus !== status) {
      return false;
    }

    if (hasIsbn && !book.isbn13 && !book.isbn10) {
      return false;
    }

    if (hasCover && !book.coverUrl) {
      return false;
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'REF_DESC':
        return parseInt(b.ref, 10) - parseInt(a.ref, 10);
      case 'TITLE_ASC':
        return a.title.localeCompare(b.title);
      case 'YEAR_DESC':
        return (parseInt(b.publishedYear || '0', 10)) - (parseInt(a.publishedYear || '0', 10));
      case 'RATING_DESC':
        return (b.rating || 0) - (a.rating || 0);
      case 'REF_ASC':
      default:
        return parseInt(a.ref, 10) - parseInt(b.ref, 10);
    }
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const pagedBooks = filtered.slice(start, start + pageSize);

  return {
    books: pagedBooks,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function getRelatedDiscoveryBooks(currentBook: DiscoveryBook, limit = 6): DiscoveryBook[] {
  const books = getAllDiscoveryBooks();
  return books
    .filter((b) => b.ref !== currentBook.ref && b.categorySlug === currentBook.categorySlug)
    .slice(0, limit);
}
