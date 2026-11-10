import type { BookIdentity, CoverDiscoveryResult } from './types';
import { pickBestCandidate } from './matcher';
import { discoverGoogleBooksCovers, googleBooksKeyConfigured } from './providers/google-books';
import { discoverOpenLibraryCovers } from './providers/open-library';

export { googleBooksKeyConfigured } from './providers/google-books';
export type { BookIdentity, CoverCandidate, CoverDiscoveryResult } from './types';

/**
 * Central cover discovery entrypoint.
 * Google Books is primary when an API key is configured; Open Library fills gaps.
 */
export async function discoverBookCover(book: BookIdentity): Promise<CoverDiscoveryResult> {
  const checkedAt = new Date().toISOString();
  try {
    const [gb, ol] = await Promise.all([
      discoverGoogleBooksCovers(book),
      discoverOpenLibraryCovers(book),
    ]);
    const all = [...gb, ...ol];
    const candidate = pickBestCandidate(all);
    if (candidate) {
      return {
        status: candidate.confidence === 'MEDIUM' ? 'review' : 'found',
        candidate,
        candidates: all,
        checkedAt,
      };
    }
    return {
      status: 'not_found',
      candidates: all,
      checkedAt,
      error: googleBooksKeyConfigured()
        ? 'no_verified_provider_match'
        : 'no_verified_provider_match_gb_key_missing',
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
