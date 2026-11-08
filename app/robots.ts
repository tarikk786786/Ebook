import { getSiteUrl } from '@/lib/site';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/book/',
          '/books/',
          '/category/',
          '/tools/',
          '/about',
          '/mission',
          '/copyright',
          '/service-fee',
          '/_next/static/',
          '/covers/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/reader/',
          '/success',
          '/orders',
          '/*?*couponCode=',
          '/*?*token=',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
