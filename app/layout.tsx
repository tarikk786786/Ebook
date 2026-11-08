import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { getSiteMetadataBase, getSiteUrl } from '@/lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: {
    default: 'AnonTrove | Premium Independent Ebook & Publishing House',
    template: '%s | AnonTrove',
  },
  description: 'Independent digital bookstore offering 18,100+ verified, DRM-free software engineering manuals, computer science textbooks, and professional guides with instant UPI checkout and in-browser reading.',
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
    title: 'AnonTrove | Premium Independent Ebook & Publishing House',
    description: 'Explore 18,100+ verified digital books, technical manuals, and computer science guides starting at ₹29. Zero DRM lock-in, instant UPI checkout, and in-browser reading.',
    url: siteUrl,
    siteName: 'AnonTrove',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnonTrove | Independent Digital Publishing',
    description: 'Explore 18,100+ verified digital books, technical manuals, and computer science guides. Instant UPI checkout & in-browser reader.',
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
    <html lang="en">
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
      <body className="min-h-screen bg-[#F7F5F0] text-[#24231F] font-sans antialiased flex flex-col justify-between selection:bg-[#E8E4DC] selection:text-[#24231F]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
