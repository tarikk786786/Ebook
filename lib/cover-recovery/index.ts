import type { BookIdentity, CoverDiscoveryResult } from './types';
import { pickBestCandidate } from './matcher';
import { discoverGoogleBooksCovers, googleBooksKeyConfigured } from './providers/google-books';

export { googleBooksKeyConfigured } from './providers/google-books';
export type { BookIdentity, CoverCandidate, CoverDiscoveryResult } from './types';

/**
 * Central cover discovery entrypoint.
 * Google Books is primary when an API key is configured.
 */
export async function discoverBookCover(book: BookIdentity): Promise<CoverDiscoveryResult> {
  const checkedAt = new Date().toISOString();
  try {
    const gb = await discoverGoogleBooksCovers(book);
    const candidate = pickBestCandidate(gb);
    if (candidate) {
      return {
        status: candidate.confidence === 'MEDIUM' ? 'review' : 'found',
        candidate,
        candidates: gb,
        checkedAt,
      };
    }
    return {
      status: 'not_found',
      candidates: gb,
      checkedAt,
      error: googleBooksKeyConfigured()
        ? 'no_high_confidence_google_books_match'
        : 'GOOGLE_BOOKS_API_KEY_missing_and_no_match',
    };
  } catch (e: any) {
    return {
      status: 'not_found',
      candidates: [],
      checkedAt,
      error: e?.message || 'discovery_failed',
    };
  }
}
