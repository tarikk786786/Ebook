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

export async function generateStaticParams() {
  return BOOK_CATALOG.filter(b => b.status === 'PUBLISHED').map((book) => ({
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

  // Get related books from same category
  const relatedBooks = BOOK_CATALOG.filter(
    (b) => b.id !== book.id && b.status === 'PUBLISHED' && (b.category === book.category || (book.tags && b.tags && b.tags.some(t => book.tags?.includes(t))))
  ).slice(0, 4);

  return <BookDetailClient book={book} relatedBooks={relatedBooks} />;
}
