import { getSiteUrl } from '@/lib/site';
import { MetadataRoute } from 'next';
import { BOOK_CATALOG } from '@/lib/catalog';
import { getAllCategories } from '@/lib/categories';
import { getAllTools } from '@/lib/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  // 1. Static high-priority indexable pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/books`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/mission`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/copyright`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/service-fee`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Topical Category Pages
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 3. Digital Tools Pages
  const toolPages: MetadataRoute.Sitemap = getAllTools().map((t) => ({
    url: `${siteUrl}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 4. Curated & Top Bestseller Catalog Ebooks (Top 1,000 for sitemap index)
  const bookPages: MetadataRoute.Sitemap = BOOK_CATALOG
    .filter((b) => b.status === 'PUBLISHED' && b.slug)
    .slice(0, 1000)
    .map((b) => ({
      url: `${siteUrl}/book/${b.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticPages, ...categoryPages, ...toolPages, ...bookPages];
}
