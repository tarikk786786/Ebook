import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getDiscoveryBookBySlug,
  getAllDiscoveryBooks,
  getRelatedDiscoveryBooks
} from '@/lib/discovery/catalog';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  Globe,
  Tag,
  Hash,
  Share2,
  BookmarkPlus,
  Search
} from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const books = getAllDiscoveryBooks();
  // Prerender first 100 books for instant edge CDN loading
  return books.slice(0, 100).map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getDiscoveryBookBySlug(params.slug);
  if (!book) {
    return {
      title: 'Book Not Found | Global Startup & Business Book Discovery',
    };
  }

  const title = `${book.title} by ${book.author} | Global Book Discovery`;
  const description = book.description
    ? book.description.slice(0, 160)
    : `Bibliographic entry #${book.ref} in ${book.category}. Written by ${book.author}. Verified index of worldwide startup & business books.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'book',
      images: book.coverUrl ? [book.coverUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: book.coverUrl ? [book.coverUrl] : [],
    },
  };
}

export default function DiscoveryBookDetailPage({ params }: Props) {
  const book = getDiscoveryBookBySlug(params.slug);

  if (!book) {
    notFound();
  }

  const related = getRelatedDiscoveryBooks(book, 6);

  // Schema.org Book JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    genre: book.category,
    ...(book.isbn13 ? { isbn: book.isbn13 } : book.isbn10 ? { isbn: book.isbn10 } : {}),
    ...(book.publishedYear ? { datePublished: book.publishedYear } : {}),
    ...(book.publisher ? { publisher: { '@type': 'Organization', name: book.publisher } } : {}),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    description: book.description || `Bibliographic record for ${book.title} by ${book.author}.`,
  };

  const openLibrarySearchUrl = `https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;
  const googleBooksSearchUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(`${book.title} ${book.author}`)}`;
  const worldcatSearchUrl = `https://www.worldcat.org/search?q=${encodeURIComponent(book.isbn13 || `${book.title} ${book.author}`)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Breadcrumb Nav */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400 overflow-hidden">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <Link href="/books" className="hover:text-emerald-400 transition-colors">
              Global Discovery
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <Link
              href={`/books?category=${book.categorySlug}`}
              className="text-slate-300 hover:text-emerald-400 transition-colors truncate max-w-[150px] sm:max-w-xs"
            >
              {book.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-emerald-400 font-mono">#{book.ref}</span>
          </div>

          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to 1,000 Catalog</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Cover & Quick Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center p-6 text-center">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="space-y-4 max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800">
                      REF #{book.ref}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-3 leading-snug">
                      {book.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">by {book.author}</p>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-500 italic">
                    Universal Master Seed Record
                  </div>
                </div>
              )}

              {/* Status pill on cover */}
              <div className="absolute top-3 right-3">
                {book.verificationStatus === 'VERIFIED' ? (
                  <span className="flex items-center gap-1 bg-emerald-950/90 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-700 shadow-lg backdrop-blur-md">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified Record
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-slate-950/90 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-700 shadow-lg backdrop-blur-md">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Seed Catalogue
                  </span>
                )}
              </div>
            </div>

            {/* Verification & Metadata Provenance Box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verification & Provenance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {book.verificationStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracted from master curation: <strong className="text-slate-200">1,000 Worldwide Startup & Business Books</strong>.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Master Seed PDF</span>
                  <span className="text-emerald-400 font-semibold">Indexed (# {book.ref})</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Open Library</span>
                  <span className={book.provenance?.open_library ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {book.provenance?.open_library ? 'Cross-Matched' : 'Pending Sync'}
                  </span>
                </div>
              </div>
            </div>

            {/* External Research Outlinks */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                Global Open Bibliographic Indexes
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={openLibrarySearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Open Library Internet Archive
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href={googleBooksSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-400" />
                    Google Books Knowledge Graph
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href={worldcatSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    WorldCat Worldwide Library Index
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Description & Related (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-400 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  REF #{book.ref}
                </span>
                <Link
                  href={`/books?category=${book.categorySlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-colors"
                >
                  <Tag className="w-3 h-3 text-emerald-400" />
                  {book.category}
                </Link>
                {book.publishedYear && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                    <Calendar className="w-3 h-3" />
                    {book.publishedYear}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
                  {book.subtitle}
                </p>
              )}

              <p className="text-sm sm:text-base text-slate-400 font-semibold">
                By <span className="text-emerald-400 font-bold">{book.author}</span>
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Curated Startup & Business Directory
                </span>
                <p className="text-xs text-slate-400">
                  Looking for digital access or study copies? Browse our reader store.
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore AnonTrove Store
                </Link>
              </div>
            </div>

            {/* Bibliographic Metadata Sheet */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Bibliographic & Publishing Metadata
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Standard Universal Citation
                </span>
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                <div className="grid grid-cols-3 px-6 py-3.5">
                  <span className="text-slate-400 font-medium">Catalogue Index Ref</span>
                  <span className="col-span-2 font-mono text-emerald-400 font-semibold">
                    #{book.ref} (Master 1,000 List)
                  </span>
                </div>
                <div className="grid grid-cols-3 px-6 py-3.5">
                  <span className="text-slate-400 font-medium">Domain Category</span>
                  <span className="col-span-2 text-slate-200 font-medium">
                    {book.category} (Section #{book.categoryIndex})
                  </span>
                </div>
                <div className="grid grid-cols-3 px-6 py-3.5">
                  <span className="text-slate-400 font-medium">Author(s)</span>
                  <span className="col-span-2 text-slate-200 font-semibold">
                    {book.author}
                  </span>
                </div>
                {book.isbn13 && (
                  <div className="grid grid-cols-3 px-6 py-3.5">
                    <span className="text-slate-400 font-medium">ISBN-13</span>
                    <span className="col-span-2 font-mono text-slate-200">
                      {book.isbn13}
                    </span>
                  </div>
                )}
                {book.isbn10 && (
                  <div className="grid grid-cols-3 px-6 py-3.5">
                    <span className="text-slate-400 font-medium">ISBN-10</span>
                    <span className="col-span-2 font-mono text-slate-200">
                      {book.isbn10}
                    </span>
                  </div>
                )}
                {book.publisher && (
                  <div className="grid grid-cols-3 px-6 py-3.5">
                    <span className="text-slate-400 font-medium">Publisher</span>
                    <span className="col-span-2 text-slate-200">
                      {book.publisher}
                    </span>
                  </div>
                )}
                {book.publishedYear && (
                  <div className="grid grid-cols-3 px-6 py-3.5">
                    <span className="text-slate-400 font-medium">First Publication</span>
                    <span className="col-span-2 text-slate-200">
                      {book.publishedYear}
                    </span>
                  </div>
                )}
                {book.pageCount && (
                  <div className="grid grid-cols-3 px-6 py-3.5">
                    <span className="text-slate-400 font-medium">Page Count</span>
                    <span className="col-span-2 text-slate-200">
                      ~{book.pageCount} pages
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 px-6 py-3.5">
                  <span className="text-slate-400 font-medium">Subject Category Slug</span>
                  <span className="col-span-2 font-mono text-slate-400">
                    {book.categorySlug}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-6 py-3.5">
                  <span className="text-slate-400 font-medium">Permanent Record Slug</span>
                  <span className="col-span-2 font-mono text-slate-400 break-all">
                    {book.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Description / Summary Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                About This Work & Curated Context
              </h3>
              {book.description ? (
                <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                  <p>{book.description}</p>
                </div>
              ) : (
                <div className="text-sm text-slate-400 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-white">{book.title}</strong> by <strong className="text-white">{book.author}</strong> was curated as essential reading under the <strong className="text-emerald-400">{book.category}</strong> curriculum in the Global 1,000 Startup & Business Books list.
                  </p>
                  <p className="text-xs text-slate-500">
                    This work represents foundational methodologies, operational principles, and strategic frameworks recognized worldwide across entrepreneurship accelerators, business faculties, and industry leadership programs.
                  </p>
                </div>
              )}
            </div>

            {/* Related Titles in Same Category */}
            {related.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Related in {book.category}
                  </h3>
                  <Link
                    href={`/books?category=${book.categorySlug}`}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    View All in Domain
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.ref}
                      href={`/books/${rel.slug}`}
                      className="group p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">
                            #{rel.ref}
                          </span>
                          <span className="text-slate-500">
                            {rel.publishedYear || 'Biblio'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {rel.author}
                        </p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Explore title &rarr;
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
