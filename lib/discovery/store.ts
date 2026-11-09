/**
 * Discovery Persistence & Storefront Approval Store
 * Manages discovered feed, approval workflows, and storefront section mappings.
 */

import fs from 'fs';
import path from 'path';
import type { DiscoveryBook, StorefrontSection, ApprovalStatus, DiscoveryFilterOptions } from './types';
import { RESEARCH_CATEGORIES } from './providers/multiProvider';

const IS_VERCEL = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const TMP_DIR = path.resolve('/tmp');

// In-memory cache for fast serverless execution across requests
let memoryDiscoveredFeed: DiscoveryBook[] | null = null;
let memoryApprovedBooks: DiscoveryBook[] | null = null;

function getPaths(filename: string): { readPath: string; writePath: string } {
  const localPath = path.join(DATA_DIR, filename);
  const tmpPath = path.join(TMP_DIR, filename);

  if (IS_VERCEL) {
    // In serverless, read from /tmp if updated dynamically, else fallback to bundled localPath
    const readPath = fs.existsSync(tmpPath) ? tmpPath : localPath;
    return { readPath, writePath: tmpPath };
  }
  return { readPath: localPath, writePath: localPath };
}

function safeReadJson<T>(filename: string, defaultVal: T): T {
  const { readPath } = getPaths(filename);
  try {
    if (fs.existsSync(readPath)) {
      const data = JSON.parse(fs.readFileSync(readPath, 'utf8'));
      return data as T;
    }
  } catch (err) {
    console.warn(`[DiscoveryStore] Error reading ${readPath}:`, err);
  }
  return defaultVal;
}

function safeWriteJson(filename: string, data: any): void {
  const { writePath } = getPaths(filename);
  try {
    const dir = path.dirname(writePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(writePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    // If writing to primary failed (e.g. EROFS on /var/task), attempt /tmp
    if (!writePath.startsWith('/tmp') && !writePath.startsWith('\\tmp')) {
      try {
        const tmpTarget = path.join(TMP_DIR, filename);
        const tmpDir = path.dirname(tmpTarget);
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(tmpTarget, JSON.stringify(data, null, 2), 'utf8');
      } catch (tmpErr) {
        console.warn(`[DiscoveryStore] Serverless write fallback failed for ${filename}:`, tmpErr);
      }
    } else {
      console.warn(`[DiscoveryStore] Write failed for ${filename}:`, err);
    }
  }
}

export class DiscoveryStore {
  /**
   * Loads discovered books from feed
   */
  static loadDiscoveredBooks(): DiscoveryBook[] {
    if (memoryDiscoveredFeed && memoryDiscoveredFeed.length > 0) {
      return memoryDiscoveredFeed;
    }
    const books = safeReadJson<DiscoveryBook[]>('discovery_books_feed.json', []);
    memoryDiscoveredFeed = Array.isArray(books) ? books : [];
    return memoryDiscoveredFeed;
  }

  /**
   * Saves updated discovered books feed
   */
  static saveDiscoveredBooks(books: DiscoveryBook[]): void {
    memoryDiscoveredFeed = books;
    safeWriteJson('discovery_books_feed.json', books);
  }

  /**
   * Loads approved books for storefront integration
   */
  static loadApprovedBooks(): DiscoveryBook[] {
    if (memoryApprovedBooks && memoryApprovedBooks.length > 0) {
      return memoryApprovedBooks;
    }
    const books = safeReadJson<DiscoveryBook[]>('discovery_approved_books.json', []);
    memoryApprovedBooks = Array.isArray(books) ? books : [];
    return memoryApprovedBooks;
  }

  /**
   * Saves approved books
   */
  static saveApprovedBooks(books: DiscoveryBook[]): void {
    memoryApprovedBooks = books;
    safeWriteJson('discovery_approved_books.json', books);

    // Also sync with demanded_books_registry.json for catalog integration
    try {
      const demanded = safeReadJson<any[]>('demanded_books_registry.json', []);
      const existingIds = new Set(demanded.map(b => b.id));
      for (const ab of books) {
        if (!existingIds.has(ab.id)) {
          demanded.push({
            id: ab.id,
            slug: ab.slug,
            title: ab.title,
            subtitle: ab.subtitle || '',
            author: ab.author,
            description: ab.description || '',
            priceInInr: ab.priceInInr || 49,
            originalPriceInInr: ab.originalPriceInInr || 199,
            pages: ab.pageCount || 280,
            format: ab.format || 'PDF (DRM-Free)',
            fileSize: '12.4 MB',
            category: ab.category,
            coverImage: ab.coverImage || ab.coverUrl || '/covers/standard-shelf-cover.jpg',
            fileName: `${ab.slug}.pdf`,
            status: 'PUBLISHED',
            rating: ab.rating || 4.7,
            reviewsCount: ab.reviewCount || 100,
            badge: ab.badge || 'DEMANDED',
            demandScore: ab.demandScore,
            targetSections: ab.targetSections
          });
          existingIds.add(ab.id);
        }
      }
      safeWriteJson('demanded_books_registry.json', demanded);
    } catch (syncErr) {
      console.warn('[DiscoveryStore] Sync with demanded_books_registry warning:', syncErr);
    }
  }

  /**
   * Approves a single book for storefront sections
   */
  static approveBook(id: string, sections?: StorefrontSection[]): DiscoveryBook | null {
    const feed = this.loadDiscoveredBooks();
    const index = feed.findIndex(b => b.id === id || b.ref === id);
    if (index === -1) return null;

    feed[index].approvalStatus = 'APPROVED';
    if (sections && sections.length > 0) {
      feed[index].targetSections = sections;
    }
    this.saveDiscoveredBooks(feed);

    // Update approved collection
    const approved = this.loadApprovedBooks().filter(b => b.id !== feed[index].id);
    approved.push(feed[index]);
    this.saveApprovedBooks(approved);

    return feed[index];
  }

  /**
   * Rejects a book
   */
  static rejectBook(id: string): boolean {
    const feed = this.loadDiscoveredBooks();
    const index = feed.findIndex(b => b.id === id || b.ref === id);
    if (index === -1) return false;

    feed[index].approvalStatus = 'REJECTED';
    this.saveDiscoveredBooks(feed);

    // Remove from approved list if previously approved
    const approved = this.loadApprovedBooks().filter(b => b.id !== feed[index].id);
    this.saveApprovedBooks(approved);

    return true;
  }

  /**
   * Bulk approves multiple books
   */
  static bulkApprove(ids: string[], sections?: StorefrontSection[]): number {
    let approvedCount = 0;
    const feed = this.loadDiscoveredBooks();
    const approvedMap = new Map<string, DiscoveryBook>();
    this.loadApprovedBooks().forEach(b => approvedMap.set(b.id, b));

    const idSet = new Set(ids);
    feed.forEach(book => {
      if (idSet.has(book.id) || idSet.has(book.ref)) {
        book.approvalStatus = 'APPROVED';
        if (sections && sections.length > 0) {
          book.targetSections = sections;
        }
        approvedMap.set(book.id, book);
        approvedCount++;
      }
    });

    this.saveDiscoveredBooks(feed);
    this.saveApprovedBooks(Array.from(approvedMap.values()));
    return approvedCount;
  }

  /**
   * Bulk rejects multiple books
   */
  static bulkReject(ids: string[]): number {
    let rejectedCount = 0;
    const feed = this.loadDiscoveredBooks();
    const idSet = new Set(ids);

    feed.forEach(book => {
      if (idSet.has(book.id) || idSet.has(book.ref)) {
        book.approvalStatus = 'REJECTED';
        rejectedCount++;
      }
    });

    this.saveDiscoveredBooks(feed);
    const approved = this.loadApprovedBooks().filter(b => !idSet.has(b.id));
    this.saveApprovedBooks(approved);
    return rejectedCount;
  }

  /**
   * Queries books for a specific storefront section (e.g. 'TOP_BESTSELLERS', 'TRENDING_EBOOKS')
   */
  static getStorefrontSectionBooks(section: StorefrontSection, limit = 8): DiscoveryBook[] {
    const approved = this.loadApprovedBooks();
    const matches = approved.filter(b => b.targetSections && b.targetSections.includes(section));
    if (matches.length > 0) {
      return matches.slice(0, limit);
    }
    // If not enough manually approved, fallback to highest demandScore in feed
    const feed = this.loadDiscoveredBooks();
    return feed
      .filter(b => b.approvalStatus !== 'REJECTED')
      .sort((a, b) => (b.demandScore ?? 0) - (a.demandScore ?? 0))
      .slice(0, limit);
  }

  /**
   * Computes telemetry stats for admin dashboard
   */
  static getDiscoveryStats() {
    const feed = this.loadDiscoveredBooks();
    const approved = this.loadApprovedBooks();

    const categoryCounts: Record<string, number> = {};
    RESEARCH_CATEGORIES.forEach(c => { categoryCounts[c.slug] = 0; });

    let verifiedBestsellers = 0;
    let highDemand = 0;
    let risingStars = 0;
    let withCover = 0;
    let withIsbn = 0;

    feed.forEach(b => {
      if (categoryCounts[b.categorySlug] !== undefined) {
        categoryCounts[b.categorySlug]++;
      }
      if (b.demandGrade === 'VERIFIED_BESTSELLER') verifiedBestsellers++;
      else if (b.demandGrade === 'HIGH_DEMAND') highDemand++;
      else if (b.demandGrade === 'RISING_STAR') risingStars++;

      if (b.coverUrl && !b.coverUrl.includes('standard-shelf-cover')) withCover++;
      if (b.isbn13 || b.isbn10) withIsbn++;
    });

    return {
      totalDiscovered: feed.length,
      totalApproved: approved.length,
      verifiedBestsellers,
      highDemand,
      risingStars,
      withCover,
      withIsbn,
      categoryDistribution: categoryCounts,
      categories: RESEARCH_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: categoryCounts[c.slug] || 0
      }))
    };
  }
}
