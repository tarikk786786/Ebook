import { getSiteUrl } from '@/lib/site';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getBookBySlug, BOOK_CATALOG, Book } from '@/lib/catalog';
import BookDetailClient from './BookDetailClient';

interface Props {
  params: {
    slug: string;
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  // Prerender top demanded & bestseller books at build time for instant CDN delivery
  // All other 12,000+ catalog titles are served dynamically on-demand with zero SSR latency via dynamicParams
  return BOOK_CATALOG
    .filter(b => b.status === 'PUBLISHED' && b.slug)
    .slice(0, 150)
    .map((book) => ({
      slug: book.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getBookBySlug(params.slug);
  if (!book) {
    return {
      title: 'Book Not Found | AnonTrove',
    };
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/book/${book.slug}`;
  const cleanDescription = book.description 
    ? book.description.slice(0, 160) 
    : `${book.title} by ${book.author}. Download verified DRM-free PDF technical guide at AnonTrove.`;
  const coverUrl = book.coverImage 
    ? (book.coverImage.startsWith('http') ? book.coverImage : `${siteUrl}${book.coverImage}`)
    : undefined;

  return {
    title: `${book.title} by ${book.author} | AnonTrove Digital Bookstore`,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${book.title} | ${book.subtitle || 'AnonTrove Digital Edition'}`,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: 'AnonTrove',
      images: coverUrl ? [coverUrl] : undefined,
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} by ${book.author}`,
      description: cleanDescription,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

export default function BookDetailPage({ params }: Props) {
  const book = getBookBySlug(params.slug);

  if (!book) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/book/${book.slug}`;
  const coverUrl = book.coverImage 
    ? (book.coverImage.startsWith('http') ? book.coverImage : `${siteUrl}${book.coverImage}`)
    : undefined;

  // Schema.org: Book + Offer + Breadcrumbs (Strict Zero Fake Reviews Compliance)
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    headline: book.subtitle || book.title,
    author: {
      '@type': 'Person',
      name: book.author || 'Author',
    },
    ...(book.publisher ? {
      publisher: {
        '@type': 'Organization',
        name: book.publisher,
      }
    } : {}),
    bookFormat: 'https://schema.org/EBook',
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    inLanguage: book.language || 'en',
    description: book.description,
    ...(coverUrl ? { image: coverUrl } : {}),
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      price: book.priceInInr,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
      seller: {
        '@type': 'Organization',
        name: 'AnonTrove',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: book.category || 'eBooks',
        item: `${siteUrl}#categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: canonicalUrl,
      },
    ],
  };

  // Get related books safely
  const bookTags = Array.isArray(book.tags) ? book.tags : [];
  const relatedBooks = BOOK_CATALOG.filter((b) => {
    if (b.id === book.id || b.status !== 'PUBLISHED') return false;
    if (b.category && b.category === book.category) return true;
    if (Array.isArray(b.tags) && bookTags.length > 0) {
      return b.tags.some((t) => bookTags.includes(t));
    }
    return false;
  }).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BookDetailClient book={book} relatedBooks={relatedBooks} />
    </>
  );
}
