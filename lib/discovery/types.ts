export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'DISCOVERED' | 'FLAGGED';

export interface DiscoveryBook {
  ref: string;
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category: string;
  categorySlug: string;
  categoryIndex: number;
  slug: string;
  isbn13?: string | null;
  isbn10?: string | null;
  publisher?: string | null;
  publishedYear?: string | null;
  pageCount?: number | null;
  description?: string | null;
  language?: string;
  coverUrl?: string | null;
  previewUrl?: string | null;
  infoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  openlibraryWorkId?: string | null;
  googleVolumeId?: string | null;
  verificationStatus: VerificationStatus;
  provenance?: {
    google_books?: boolean;
    open_library?: boolean;
    wikidata?: boolean;
    pdf_seed?: boolean;
  };
}

export interface DiscoveryCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface DiscoveryFilterOptions {
  query?: string;
  categorySlug?: string;
  status?: VerificationStatus | 'ALL';
  hasIsbn?: boolean;
  hasCover?: boolean;
  minYear?: number;
  maxYear?: number;
  sortBy?: 'REF_ASC' | 'REF_DESC' | 'TITLE_ASC' | 'YEAR_DESC' | 'RATING_DESC';
  page?: number;
  pageSize?: number;
}
