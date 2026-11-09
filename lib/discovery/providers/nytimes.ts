/**
 * New York Times Books API Provider
 * Connects to NYT Bestseller Lists API v3
 * Official docs: https://developer.nytimes.com/docs/books-product/1/overview
 */

export interface NytBestsellerBook {
  rank: number;
  rank_last_week: number;
  weeks_on_list: number;
  asterisk: number;
  dagger: number;
  primary_isbn10: string;
  primary_isbn13: string;
  publisher: string;
  description: string;
  price: string;
  title: string;
  author: string;
  contributor: string;
  contributor_note: string;
  book_image: string;
  amazon_product_url: string;
  age_group: string;
  book_review_link: string;
  first_chapter_link: string;
  sunday_review_link: string;
  article_chapter_link: string;
  isbns: Array<{ isbn10: string; isbn13: string }>;
  buy_links: Array<{ name: string; url: string }>;
}

const BASE_URL = 'https://api.nytimes.com/svc/books/v3/lists/current';

export class NytBooksProvider {
  private static getApiKey(): string | undefined {
    return process.env.NYT_BOOKS_API_KEY || undefined;
  }

  /**
   * Fetches NYT Bestseller list (e.g. 'hardcover-fiction', 'business-books')
   */
  static async getBestsellerList(listName = 'combined-print-and-e-book-nonfiction'): Promise<NytBestsellerBook[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      // API key not configured, return empty array to trigger graceful OpenLibrary Trending fallback
      return [];
    }

    const url = `${BASE_URL}/${encodeURIComponent(listName)}.json?api-key=${apiKey}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AnonTroveBookDiscoveryBot/1.0' },
        next: { revalidate: 86400 } // NYT updates weekly
      });

      if (!res.ok) {
        throw new Error(`NYT Books API HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.results?.books || [];
    } catch (err: any) {
      console.warn(`[NytBooksProvider] Failed fetching list "${listName}":`, err.message);
      return [];
    }
  }
}
