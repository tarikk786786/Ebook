export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'DISCOVERED' | 'FLAGGED';

export type DemandGrade = 'VERIFIED_BESTSELLER' | 'HIGH_DEMAND' | 'RISING_STAR' | 'STANDARD_DEMAND';

export type StorefrontSection = 
  | 'TRENDING_EBOOKS' 
  | 'TOP_BESTSELLERS' 
  | 'MOST_POPULAR' 
  | 'RISING_STARS' 
  | 'NEW_RELEASES' 
  | 'RECOMMENDED_BOOKS';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DiscoverySource = 
  | 'OPEN_LIBRARY' 
  | 'GOOGLE_BOOKS' 
  | 'NYT_BESTSELLERS' 
  | 'INTERNET_ARCHIVE' 
  | 'ISBNDB' 
  | 'MULTI_SOURCE';

export interface DemandEvidence {
  bestsellerRank?: number | null;
  bestsellerList?: string | null;
  searchInterestScore: number;
  ratingsCount: number;
  averageRating: number;
  readingLogCount: number;
  recencyScore: number;
  confidenceScore: number;
  breakdown: {
    bestsellerPoints: number;
    reviewPoints: number;
    searchInterestPoints: number;
    recencyPoints: number;
    metadataQualityPoints: number;
  };
}

export interface DiscoveryBook {
  ref: string;
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  category: string;
  categorySlug: string;
  categoryIndex?: number;
  slug: string;
  isbn13?: string | null;
  isbn10?: string | null;
  publisher?: string | null;
  publishedYear?: string | number | null;
  pageCount?: number | null;
  description?: string | null;
  language?: string;
  coverUrl?: string | null;
  coverImage?: string | null;
  image?: string | null;
  previewUrl?: string | null;
  infoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  openlibraryWorkId?: string | null;
  googleVolumeId?: string | null;
  verificationStatus: VerificationStatus;
  
  // Real-time Intelligence & Demand Scoring (with defaults)
  demandScore?: number;
  demandGrade?: DemandGrade;
  demandEvidence?: DemandEvidence;
  approvalStatus?: ApprovalStatus;
  targetSections?: StorefrontSection[];
  source?: DiscoverySource;
  sourceUrl?: string | null;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  collectedAt?: string;
  priceInInr?: number;
  originalPriceInInr?: number;
  badge?: string;
  format?: string;

  provenance?: {
    google_books?: boolean;
    open_library?: boolean;
    nyt_books?: boolean;
    internet_archive?: boolean;
    wikidata?: boolean;
    pdf_seed?: boolean;
    master_archive?: boolean;
  };
}

export interface DiscoveryCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
}

export interface DiscoveryFilterOptions {
  query?: string;
  categorySlug?: string;
  status?: VerificationStatus | 'ALL';
  approvalStatus?: ApprovalStatus | 'ALL';
  demandGrade?: DemandGrade | 'ALL';
  section?: StorefrontSection | 'ALL';
  hasIsbn?: boolean;
  hasCover?: boolean;
  minYear?: number;
  maxYear?: number;
  minDemandScore?: number;
  sortBy?: 'DEMAND_DESC' | 'RATING_DESC' | 'YEAR_DESC' | 'TITLE_ASC' | 'REF_ASC' | 'REF_DESC';
  page?: number;
  pageSize?: number;
}
