import toolsRegistryData from '@/data/tools_registry.json';

export interface ToolDownloadAsset {
  fileName: string;
  platform: string;
  fileSize: string;
  sizeBytes: number;
  downloadUrl: string;
  downloadCount: number;
  verified: boolean;
  isBinary: boolean;
}

export interface ToolRelease {
  version: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  releaseNotes: string;
  checksums: Record<string, string>;
}

export interface EbookTool {
  id: string;
  slug: string;
  name: string;
  category: string;
  secondaryCategories: string[];
  shortDescription: string;
  detailedDescription: string;
  features: string[];
  supportedFormats: string[];
  supportedOs: string[];
  requirements: string;
  packageInstallCommands: Record<string, string>;
  dockerImage?: string | null;
  primaryLanguage: string;
  license: string;
  isArchived: boolean;
  isAbandoned: boolean;
  securityStatus: string;
  verifiedAuthentic: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  iconName: string;
  officialWebsite: string;
  documentation: string;
  githubRepo: string;
  repoFullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  latestRelease: ToolRelease;
  downloads: ToolDownloadAsset[];
  gitCloneCommand: string;
  lastCheckedDate: string;
}

export interface ToolsRegistryMetadata {
  generatedAt: string;
  totalTools: number;
  categoriesCount: number;
  sources: string;
  verifiedAuthenticCount: number;
}

export const TOOL_CATEGORIES = [
  'Ebook Scrapers and Discovery',
  'Ebook Download Managers',
  'Ebook Readers',
  'PDF Tools',
  'EPUB Tools',
  'MOBI and Kindle Tools',
  'Ebook Converters',
  'OCR and Document Extraction',
  'Metadata and ISBN Tools',
  'Cover Discovery',
  'Library Management',
  'Search and Indexing',
  'Automation and AI Tools',
  'Open-Access Research Tools'
] as const;

export type ToolCategory = typeof TOOL_CATEGORIES[number];

export function getAllTools(): EbookTool[] {
  return (toolsRegistryData.tools as unknown as EbookTool[]) || [];
}

export function getToolBySlug(slug: string): EbookTool | undefined {
  const tools = getAllTools();
  return tools.find((t) => t.slug.toLowerCase() === slug.toLowerCase() || t.id.toLowerCase() === slug.toLowerCase());
}

export function getFeaturedTools(): EbookTool[] {
  return getAllTools().filter((t) => t.isFeatured);
}

export function getToolsByCategory(category: string): EbookTool[] {
  if (!category || category === 'ALL') return getAllTools();
  return getAllTools().filter(
    (t) => t.category === category || (t.secondaryCategories && t.secondaryCategories.includes(category))
  );
}

export function getCategoryCounts(): Record<string, number> {
  const tools = getAllTools();
  const counts: Record<string, number> = {};
  TOOL_CATEGORIES.forEach((cat) => {
    counts[cat] = tools.filter((t) => t.category === cat || t.secondaryCategories.includes(cat)).length;
  });
  return counts;
}

export function getToolsMetadata(): ToolsRegistryMetadata {
  return toolsRegistryData.metadata as ToolsRegistryMetadata;
}
