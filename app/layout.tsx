import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AnonTrove | Zero-Trace Privacy-First Digital Bookshelf',
  description: 'Instant, non-custodial eBook & PDF downloads with 0% fee Direct UPI payments and zero PII tracking.',
  robots: 'index, follow',
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
