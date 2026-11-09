/**
 * Open Library API Provider
 * Connects to Open Library Trending, Subjects, and Search APIs (100% Free, Zero Key Required)
 * Official docs: https://openlibrary.org/developers/api
 */

export interface OpenLibraryRawBook {
  key: string; // e.g. "/works/OL45804W"
  title: string;
  author_name?: string[];
  authors?: Array<{ name: string; key: string }>;
  first_publish_year?: number;
  cover_i?: number;
  cover_id?: number;
  isbn?: string[];
  edition_count?: number;
  ratings_count?: number;
  ratings_average?: number;
  want_to_read_count?: number;
  currently_reading_count?: number;
  already_read_count?: number;
  subject?: string[];
  description?: string | { value: string };
  publisher?: string[];
  language?: string[];
}

const BASE_URL = 'https://openlibrary.org';
const COVERS_BASE = 'https://covers.openlibrary.org/b/id';
const USER_AGENT = 'AnonTroveBookDiscoveryBot/1.0 (https://anontrove.com; mailto:tarik@anontrove.com)';

export class OpenLibraryProvider {
  /**
   * Fetches the current daily trending books from Open Library
   */
  static async getTrendingDaily(limit = 25): Promise<OpenLibraryRawBook[]> {
    try {
      const url = `${BASE_URL}/trending/daily.json?limit=${limit}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 3600 }
      });
      if (!res.ok) throw new Error(`OpenLibrary Trending Daily HTTP ${res.status}`);
      const data = await res.json();
      return (data.works || []).slice(0, limit);
    } catch (err: any) {
      console.warn('[OpenLibraryProvider] Trending Daily fetch error:', err.message);
      return [];
    }
  }

  /**
   * Fetches weekly trending books
   */
  static async getTrendingWeekly(limit = 25): Promise<OpenLibraryRawBook[]> {
    try {
      const url = `${BASE_URL}/trending/weekly.json?limit=${limit}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 86400 }
      });
      if (!res.ok) throw new Error(`OpenLibrary Trending Weekly HTTP ${res.status}`);
      const data = await res.json();
      return (data.works || []).slice(0, limit);
    } catch (err: any) {
      console.warn('[OpenLibraryProvider] Trending Weekly fetch error:', err.message);
      return [];
    }
  }

  /**
   * Fetches books by subject category (e.g. 'business', 'artificial_intelligence', 'self-help')
   */
  static async getBooksBySubject(subject: string, limit = 25): Promise<OpenLibraryRawBook[]> {
    try {
      const formattedSubject = encodeURIComponent(subject.toLowerCase().replace(/\s+/g, '_'));
      const url = `${BASE_URL}/subjects/${formattedSubject}.json?limit=${limit}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 3600 }
      });
      if (!res.ok) throw new Error(`OpenLibrary Subject (${subject}) HTTP ${res.status}`);
      const data = await res.json();
      return (data.works || []).slice(0, limit);
    } catch (err: any) {
      console.warn(`[OpenLibraryProvider] Subject "${subject}" fetch error:`, err.message);
      return [];
    }
  }

  /**
   * Searches Open Library by title or general query
   */
  static async searchBooks(query: string, limit = 20): Promise<OpenLibraryRawBook[]> {
    try {
      const url = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (!res.ok) throw new Error(`OpenLibrary Search HTTP ${res.status}`);
      const data = await res.json();
      return (data.docs || []).slice(0, limit);
    } catch (err: any) {
      console.warn(`[OpenLibraryProvider] Search "${query}" fetch error:`, err.message);
      return [];
    }
  }

  /**
   * Generates a verified CDN cover image URL from Open Library cover ID
   */
  static getCoverUrl(coverId?: number | null, size: 'S' | 'M' | 'L' = 'L'): string | null {
    if (!coverId || coverId <= 0) return null;
    return `${COVERS_BASE}/${coverId}-${size}.jpg`;
  }
}
