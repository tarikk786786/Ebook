import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getAllCategories,
  getCategoryBySlug,
  getBooksForCategory,
} from '@/lib/categories';
import {
  BookOpen,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllCategories().map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);
  if (!category) {
    return {
      title: 'Category Not Found | AnonTrove',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';
  const canonicalUrl = `${siteUrl}/category/${category.slug}`;

  return {
    title: category.metaTitle,
    description: category.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      url: canonicalUrl,
      siteName: 'AnonTrove',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: category.metaTitle,
      description: category.metaDescription,
    },
  };
}

export default function CategoryPage({ params }: Props) {
  const category = getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const books = getBooksForCategory(category.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';
  const canonicalUrl = `${siteUrl}/category/${category.slug}`;

  // Structured Data: BreadcrumbList + FAQPage + CollectionPage
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
        name: 'Categories',
        item: `${siteUrl}#categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: canonicalUrl,
    numberOfItems: books.length,
  };

  // Preview the first 48 books for fast initial render and deep crawl paths
  const displayBooks = books.slice(0, 48);
  const otherCategories = getAllCategories().filter((c) => c.slug !== category.slug).slice(0, 4);

  return (
    <>
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Navbar />

      <main className="min-h-screen bg-[#0B0F17] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs text-slate-400 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/#categories" className="hover:text-emerald-400 transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium truncate">{category.name}</span>
          </nav>

          {/* Hero Header */}
          <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/30 border border-slate-800 rounded-3xl p-6 sm:p-10 mb-10 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{category.badge} Collection • {books.length.toLocaleString()} Titles</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                {category.name}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6">
                {category.longDescription}
              </p>

              {/* Subcategories tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {category.subcategories.map((sub, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700/60"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
              <div>
                <p className="text-xs text-slate-400">Inventory</p>
                <p className="text-xl font-bold text-white mt-0.5">{books.length.toLocaleString()} Titles</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Pricing</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">From ₹29</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Format</p>
                <p className="text-xl font-bold text-white mt-0.5">DRM-Free PDF</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Access</p>
                <p className="text-xl font-bold text-white mt-0.5">Instant + Reader</p>
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Curated Titles in {category.name}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Showing top {displayBooks.length} of {books.length.toLocaleString()} verified ebooks
                </p>
              </div>
              <Link
                href={`/?category=${encodeURIComponent(category.matchedCatalogCategories[0] || category.name)}`}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>View Full Filterable Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {displayBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayBooks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/book/${book.slug}`}
                    className="group flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm hover:shadow-emerald-500/5 hover:-translate-y-1"
                  >
                    <div>
                      {/* Cover Thumbnail / Badge */}
                      <div className="aspect-[3/4] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden mb-3 relative flex items-center justify-center">
                        {book.coverImage && book.coverImage.length > 5 ? (
                          <img
                            src={book.coverImage}
                            alt={`${book.title} cover`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{book.format || 'PDF Guide'}</span>
                          </div>
                        )}
                        {book.badge && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px] shadow-sm">
                            {book.badge}
                          </span>
                        )}
                      </div>

                      {/* Title & Author */}
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                        {book.author}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-emerald-400">₹{book.priceInInr}</span>
                        {book.originalPriceInInr > book.priceInInr && (
                          <span className="text-xs text-slate-500 line-through ml-1.5">₹{book.originalPriceInInr}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-white flex items-center space-x-1">
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Titles being verified for this collection</p>
                <p className="text-xs text-slate-400 mt-1">Check back shortly or explore other categories.</p>
              </div>
            )}
          </div>

          {/* Frequently Asked Questions (AEO & FAQ Structured Content) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-10 mb-14">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Frequently Asked Questions About {category.name}
            </h2>

            <div className="space-y-4">
              {category.faqs.map((faq, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Categories Navigation (Internal Linking Hub) */}
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Explore Related Learning Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all group"
                >
                  <p className="text-xs font-semibold text-emerald-400">{c.badge}</p>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 mt-1 transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {c.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
