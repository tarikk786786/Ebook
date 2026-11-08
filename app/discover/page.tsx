import type { Metadata } from 'next';
import { getDiscoveredBooks, getCatalogMetadata, getSourceRegistry } from '@/lib/scraper';
import DiscoverClient from '@/components/discover/DiscoverClient';

export const metadata: Metadata = {
  title: 'Universal Ebook Discovery Engine | Global Open Access Search',
  description:
    'Discover ebooks across Google Books, Open Library, Internet Archive, Project Gutenberg, and verified technical repositories. Filter by public domain, open-access, borrowable, and download eligibility.',
  openGraph: {
    title: 'Universal Ebook Discovery Engine | Global Search',
    description:
      'Aggregated discovery index across public domain repositories, academic preprints, and open-access catalogues.',
    type: 'website',
    url: 'https://ebook-sandy-chi.vercel.app/discover',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Ebook Discovery Engine',
    description:
      'Search, inspect and access ebooks worldwide across open-access and authorized sources.',
  },
};

export default function DiscoverPage() {
  const books = getDiscoveredBooks();
  const metadata = getCatalogMetadata();
  const sources = getSourceRegistry();

  return (
    <DiscoverClient
      initialBooks={books}
      metadata={metadata}
      sources={sources}
    />
  );
}
