export type CoverConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type CoverProviderName =
  | 'google-books'
  | 'open-library'
  | 'internet-archive'
  | 'local-embedded'
  | 'local-pdf-render'
  | 'hardcover'
  | 'isbndb';

export type CoverStatus =
  | 'pending'
  | 'found'
  | 'not_found'
  | 'review'
  | 'rejected'
  | 'manual';

export interface CoverCandidate {
  provider: CoverProviderName;
  coverUrl: string;
  sourceId?: string;
  title?: string;
  authors?: string[];
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  publishedYear?: string;
  confidence: CoverConfidence;
  reason: string;
}

export interface BookIdentity {
  id?: string;
  catalogNum?: number;
  slug?: string;
  title: string;
  author?: string;
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  publicationYear?: string | number;
  category?: string;
}

export interface CoverDiscoveryResult {
  status: CoverStatus;
  candidate?: CoverCandidate;
  candidates: CoverCandidate[];
  checkedAt: string;
  error?: string;
}
