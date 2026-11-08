import type { Metadata } from 'next';
import { getAllTools, getCategoryCounts, getToolsMetadata } from '@/lib/tools';
import ToolsClient from '@/components/tools/ToolsClient';

export const metadata: Metadata = {
  title: 'Ebook Tools & Resources | Official Ebook Software Download Center',
  description:
    'Discover the tools to search, manage, read, convert and organize your digital library. Official verified releases for Calibre, KOReader, PyMuPDF, Sigil, Pandoc, OCRmyPDF, Kavita, and more.',
  openGraph: {
    title: 'Ebook Tools & Resources | Official Ebook Software Download Center',
    description:
      'Centralized directory of verified ebook discovery, conversion, reading, OCR, and library management software with official binary downloads.',
    type: 'website',
    url: 'https://ebook-sandy-chi.vercel.app/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ebook Tools & Resources | Download Center',
    description:
      'Discover the tools to search, manage, read, convert and organize your digital library.',
  },
};

export default function ToolsPage() {
  const tools = getAllTools();
  const categoryCounts = getCategoryCounts();
  const meta = getToolsMetadata();

  return (
    <ToolsClient
      initialTools={tools}
      categoriesWithCounts={categoryCounts}
      generatedAt={meta.generatedAt}
    />
  );
}
