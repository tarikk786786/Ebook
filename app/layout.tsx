import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ebook-sandy-chi.vercel.app'),
  title: 'AnonTrove | Universal Digital Library & DRM-Free eBooks',
  description: 'Massive universal collection of 1,660+ verified digital books, technical guides, courses, and exam notes starting at ₹29. Instant 0% fee direct UPI download.',
  robots: 'index, follow',
  openGraph: {
    title: 'AnonTrove | Universal Digital Library & DRM-Free eBooks',
    description: 'Massive universal collection of 1,660+ verified digital books, technical guides, courses, and exam notes starting at ₹29. Instant 0% fee direct UPI download.',
    url: 'https://ebook-sandy-chi.vercel.app',
    siteName: 'AnonTrove',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnonTrove | Universal Digital Library',
    description: 'Massive universal collection of 1,660+ verified digital books starting at ₹29. Instant 0% fee direct UPI download.',
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
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 antialiased flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
