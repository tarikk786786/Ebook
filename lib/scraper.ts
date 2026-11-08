import universalCatalogData from '@/data/scraper/universal_catalog.json';
import sourceRegistryData from '@/data/scraper/source_registry.json';

export interface DiscoveredEbook {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  isbns: string[];
  primaryIsbn?: string;
  pageCount: number;
  categories: string[];
  language: string;
  coverImage: string;
  formats: string[];
  availability: 'PUBLIC_DOMAIN' | 'OPEN_ACCESS' | 'FREE_AUTHORIZED' | 'BORROWABLE' | 'PAID_STORE' | 'PREVIEW_ONLY' | 'METADATA_RECORD';
  license: string;
  previewUrl?: string;
  downloadUrl?: string;
  infoUrl?: string;
  confidenceScore: number;
  telegramMeta?: {
    sourceChannel?: string;
    messageId?: number;
    sha256?: string;
    fileName?: string;
  };
}

export interface UniversalCatalogMetadata {
  version: string;
  lastSynced: string;
  totalUniqueBooks: number;
  sourceBreakdown: Record<string, number>;
  availabilityBreakdown: Record<string, number>;
  scanDurationSeconds: number;
}

export interface SourceRegistryItem {
  id: string;
  name: string;
  url: string;
  category: string;
  apiAvailable: boolean;
  authRequirements: string;
  crawlPermissions: string;
  rateLimits: string;
  supportedFormats: string[];
  copyrightPolicy: string;
  importPermissions: string;
  connectionStatus: 'ACTIVE' | 'STANDBY' | 'AUTH_KEY_REQUIRED_RATE_LIMITED' | 'DISABLED';
  lastSuccessfulScan: string;
}

export function getDiscoveredBooks(): DiscoveredEbook[] {
  return (universalCatalogData.books as unknown as DiscoveredEbook[]) || [];
}

export function getCatalogMetadata(): UniversalCatalogMetadata {
  return universalCatalogData.metadata as UniversalCatalogMetadata;
}

export function getSourceRegistry(): SourceRegistryItem[] {
  return (sourceRegistryData.sources as unknown as SourceRegistryItem[]) || [];
}
