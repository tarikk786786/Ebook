import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AnonTrove | Premium Independent Ebook & Technical Knowledge Platform',
    template: '%s | AnonTrove',
  },
  description: 'Independent digital publishing and ebook platform selling 12,192+ verified PDF and EPUB technical guides, computer science textbooks, and trading manuals with instant UPI delivery and in-browser reading.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'AnonTrove | Premium Independent Ebook Platform',
    description: 'Explore 12,192+ verified digital books, technical manuals, and computer science guides starting at ₹29. Zero DRM lock-in, instant UPI checkout, and in-browser reading.',
    url: siteUrl,
    siteName: 'AnonTrove',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnonTrove | Independent Ebook Platform',
    description: 'Explore 12,192+ verified digital books, technical manuals, and computer science guides. Instant UPI checkout & in-browser reader.',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AnonTrove',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: 'Independent digital bookstore and publishing platform for verified technical manuals, software engineering handbooks, and educational guides.',
  sameAs: [
    'https://github.com/tarikk786786/Ebook',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AnonTrove',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 antialiased flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
