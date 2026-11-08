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
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN', // Allows safe same-origin iframe embedding for internal PDF/EPUB reader
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://famgateway.in https://images.unsplash.com https://*.r2.cloudflarestorage.com",
      "connect-src 'self' https://famgateway.in https://*.supabase.co",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "frame-src 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Strips 'X-Powered-By: Next.js' to prevent technology fingerprinting
  headers: async () => [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ],
  images: {
    dangerouslyAllowSVG: false, // Disables unauthenticated SVG parsing to mitigate GHSA-2464-fhr4-w9xw
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'famgateway.in',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
