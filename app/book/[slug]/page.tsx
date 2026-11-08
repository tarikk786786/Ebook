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
  // Prerender all published books at build time for instant CDN loading and zero SSR failures
  return BOOK_CATALOG
    .filter(b => b.status === 'PUBLISHED' && b.slug)
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

  return {
    title: `${book.title} by ${book.author} | AnonTrove Digital Bookstore`,
    description: book.description,
    openGraph: {
      title: `${book.title} | ${book.subtitle}`,
      description: book.description,
      images: [book.coverImage],
    },
  };
}

export default function BookDetailPage({ params }: Props) {
  const book = getBookBySlug(params.slug);

  if (!book) {
    notFound();
  }

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

  return <BookDetailClient book={book} relatedBooks={relatedBooks} />;
}
