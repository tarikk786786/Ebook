/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://famgateway.in https://images.unsplash.com https://api.qrserver.com https://covers.openlibrary.org https://books.google.com https://images-na.ssl-images-amazon.com https://m.media-amazon.com https://archive.org https://*.archive.org https://*.r2.cloudflarestorage.com",
      "connect-src 'self' https://famgateway.in https://*.supabase.co",
      "font-src 'self' data:",
      "object-src 'none'",
      "worker-src blob: 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self' https://tarikk786786.github.io https://*.github.io https://*.devs.surf https://*.thedev.id https://*.is-a.bot https://*.is-cod.in https://*.is-not.cool https://*.creepers.sbs https://*.us.kg",
      "frame-src 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  experimental: {
    // These files are read through fs at runtime (rather than imported). Without
    // explicit tracing, Vercel's serverless functions omit the 86k catalog and
    // cover/metadata indexes, so the storefront silently falls back to sparse
    // records and generic cover placeholders.
    outputFileTracingIncludes: {
      "/api/books": [
        "./data/catalog/master_86k_part1.json",
        "./data/catalog/master_86k_part2.json",
        "./data/catalog/duplicate_suppression.json",
        "./data/catalog/cover_map_from_pdfs.json",
        "./data/catalog/cover_map_from_book_covers.json",
        "./data/catalog/cover_map_from_pdf_list.json",
        "./data/catalog/cover_url_index_86k.json",
        "./data/catalog/market_price_overlay.json",
        "./data/catalog/verified_metadata_overlay_86k.json",
        "./data/catalog/curated_masterclasses_from_pdf.json",
        "./data/catalog/research_link_directory.json.gz",
      ],
      "/api/covers/[slug]": [
        "./data/catalog/master_86k_part1.json",
        "./data/catalog/master_86k_part2.json",
        "./data/catalog/cover_map_from_pdfs.json",
        "./data/catalog/cover_map_from_book_covers.json",
        "./data/catalog/cover_map_from_pdf_list.json",
        "./data/catalog/cover_url_index_86k.json",
        "./data/catalog/curated_masterclasses_from_pdf.json",
      ],
      "/book/[slug]": [
        "./data/catalog/master_86k_part1.json",
        "./data/catalog/master_86k_part2.json",
        "./data/catalog/duplicate_suppression.json",
        "./data/catalog/cover_map_from_pdfs.json",
        "./data/catalog/cover_map_from_book_covers.json",
        "./data/catalog/cover_map_from_pdf_list.json",
        "./data/catalog/cover_url_index_86k.json",
        "./data/catalog/market_price_overlay.json",
        "./data/catalog/verified_metadata_overlay_86k.json",
        "./data/catalog/curated_masterclasses_from_pdf.json",
        "./data/catalog/research_link_directory.json.gz",
      ],
    },
  },
  reactStrictMode: true,
  poweredByHeader: false, // Strips 'X-Powered-By: Next.js' to prevent technology fingerprinting
  // Large catalog SSG on Hobby builders needs more than the default 60s page timeout
  staticPageGenerationTimeout: 180,
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],

  webpack: (config) => {
    // Allow pdfjs-dist to properly bundle its web worker
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },  images: {
    dangerouslyAllowSVG: false, // Disables unauthenticated SVG parsing to mitigate GHSA-2464-fhr4-w9xw
    remotePatterns: [
      { protocol: 'https', hostname: 'famgateway.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
};

export default nextConfig;
