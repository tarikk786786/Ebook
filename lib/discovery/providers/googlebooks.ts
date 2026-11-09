/**
 * Google Books API Provider
 * Connects to Google Books API v1
 * Official docs: https://developers.google.com/books
 */

export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{ type: 'ISBN_10' | 'ISBN_13' | 'OTHER'; identifier: string }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export class GoogleBooksProvider {
  private static getApiKey(): string | undefined {
    return process.env.GOOGLE_BOOKS_API_KEY || undefined;
  }

  /**
   * Searches Google Books by query or subject
   */
  static async searchBooks(query: string, options: { subject?: string; maxResults?: number; orderBy?: 'relevance' | 'newest' } = {}): Promise<GoogleBookVolume[]> {
    const { subject, maxResults = 20, orderBy = 'relevance' } = options;
    const apiKey = this.getApiKey();

    let fullQuery = query;
    if (subject) {
      fullQuery = fullQuery ? `${fullQuery}+subject:${subject}` : `subject:${subject}`;
    }

    const params = new URLSearchParams({
      q: fullQuery,
      maxResults: String(Math.min(maxResults, 40)),
      orderBy,
      printType: 'books'
    });

    if (apiKey) {
      params.append('key', apiKey);
    }

    const url = `${BASE_URL}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AnonTroveBookDiscoveryBot/1.0' },
        next: { revalidate: 3600 }
      });

      if (res.status === 429) {
        console.warn('[GoogleBooksProvider] Rate limited (HTTP 429), triggering provider fallback');
        return [];
      }

      if (!res.ok) {
        throw new Error(`Google Books API HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.items || [];
    } catch (err: any) {
      console.warn('[GoogleBooksProvider] Search error:', err.message);
      return [];
    }
  }

  /**
   * Fetches high-resolution cover URL from Google Books volume
   */
  static getCoverUrl(volume: GoogleBookVolume): string | null {
    const images = volume.volumeInfo.imageLinks;
    if (!images) return null;
    const raw = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail;
    if (!raw) return null;
    // Upgrade http to https and remove curl edge artifacts
    return raw.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/g, '');
  }
}
