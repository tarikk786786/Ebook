import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://ebook-sandy-chi.vercel.app'),
  title: 'AnonTrove | Premium Independent Ebook Commerce Platform',
  description: 'Independent digital publishing and ebook ecommerce platform selling 1,668+ verified PDF and EPUB technical guides, textbooks, and masterclasses. Multi-item cart, Razorpay & UPI checkout, and in-browser reading.',
  robots: 'index, follow',
  openGraph: {
    title: 'AnonTrove | Premium Independent Ebook Commerce Platform',
    description: 'Independent digital publishing and ebook ecommerce platform selling 1,668+ verified PDF and EPUB technical guides, textbooks, and masterclasses. Multi-item cart, Razorpay & UPI checkout, and in-browser reading.',
    url: 'https://ebook-sandy-chi.vercel.app',
    siteName: 'AnonTrove',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnonTrove | Independent Ebook Commerce',
    description: 'Independent digital publishing and ebook ecommerce platform. Multi-item cart, Razorpay & UPI checkout, and in-browser reading.',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
