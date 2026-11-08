import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';

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
