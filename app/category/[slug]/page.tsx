import { getSiteUrl } from '@/lib/site';
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
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Award
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

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/category/${category.slug}`;

  return {
    title: `${category.name} Ebooks | AnonTrove Publishing`,
    description: category.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} Ebooks | AnonTrove`,
      description: category.metaDescription,
      url: canonicalUrl,
      siteName: 'AnonTrove',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} Ebooks | AnonTrove`,
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
  const siteUrl = getSiteUrl();
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

  const displayBooks = books.slice(0, 48);
  const otherCategories = getAllCategories().filter((c) => c.slug !== category.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans">
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

      <main className="flex-1 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs text-[#81796D] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#24231F] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#81796D]" />
            <Link href="/#catalog" className="hover:text-[#24231F] transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#81796D]" />
            <span className="text-[#24231F] font-medium truncate">{category.name}</span>
          </nav>

          {/* Hero Header */}
          <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 sm:p-10 mb-10 shadow-book">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] text-[#9A704B] text-xs font-semibold mb-4">
                <Award className="w-3.5 h-3.5" />
                <span>{category.badge} Discipline • {books.length.toLocaleString()} Titles</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#24231F] tracking-tight mb-4 leading-tight">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-[#6E685F] leading-relaxed mb-6">
                {category.longDescription}
              </p>

              {/* Subcategories tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {category.subcategories.map((sub, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[#FAF8F5] text-[#5B5449] text-xs rounded-full border border-[#E8E4DC]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E8E4DC]">
              <div>
                <p className="text-xs text-[#81796D]">Inventory</p>
                <p className="font-serif text-xl font-bold text-[#24231F] mt-0.5">{books.length.toLocaleString()} Titles</p>
              </div>
              <div>
                <p className="text-xs text-[#81796D]">Pricing</p>
                <p className="font-serif text-xl font-bold text-[#24231F] mt-0.5">From ₹29</p>
              </div>
              <div>
                <p className="text-xs text-[#81796D]">Format</p>
                <p className="font-serif text-xl font-bold text-[#24231F] mt-0.5">DRM-Free PDF</p>
              </div>
              <div>
                <p className="text-xs text-[#81796D]">Delivery</p>
                <p className="font-serif text-xl font-bold text-[#24231F] mt-0.5">Instant + Reader</p>
              </div>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#24231F]">Curated Titles in {category.name}</h2>
                <p className="text-xs text-[#81796D] mt-1">
                  Showing top {displayBooks.length} of {books.length.toLocaleString()} verified ebooks
                </p>
              </div>
              <Link
                href={`/#catalog`}
                className="text-xs font-semibold text-[#9A704B] hover:text-[#24231F] flex items-center space-x-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {displayBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayBooks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/book/${book.slug}`}
                    className="group flex flex-col justify-between p-3.5 rounded-xl bg-white hover:border-[#D5CEBE] border border-[#E8E4DC] transition-all shadow-book hover:shadow-book-hover"
                  >
                    <div>
                      {/* Cover Thumbnail */}
                      <div className="aspect-[3/4] w-full rounded overflow-hidden bg-[#FAF8F5] border border-[#E8E4DC] mb-3 relative flex items-center justify-center">
                        <img
                          src={`/api/covers/${book.slug}?v=10`}
                          alt={`${book.title} cover`}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          loading="lazy"
                        />
                        {book.badge && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC]">
                            {book.badge}
                          </span>
                        )}
                      </div>

                      {/* Title & Author */}
                      <h3 className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B] transition-colors line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-[#81796D] line-clamp-1 mb-2">
                        {book.author}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-2.5 border-t border-[#E8E4DC] flex items-center justify-between">
                      <span className="font-serif text-sm font-bold text-[#24231F]">₹{book.priceInInr}</span>
                      <span className="text-[11px] font-medium text-[#81796D] group-hover:text-[#24231F] flex items-center gap-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3 text-[#9A704B]" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-[#E8E4DC] rounded-xl p-8">
                <BookOpen className="w-10 h-10 text-[#81796D] mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#24231F]">No published titles in this section yet</h3>
                <p className="text-xs text-[#6E685F] mt-1">Check back soon or explore the complete catalog.</p>
              </div>
            )}
          </div>

          {/* FAQ Section with FAQPage Schema Content */}
          <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 sm:p-10 mb-14 shadow-book">
            <div className="flex items-center space-x-2 text-[#9A704B] mb-2">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Reader FAQ</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#24231F] mb-6">
              Frequently Asked Questions About {category.name}
            </h2>
            <div className="space-y-4">
              {category.faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC]">
                  <h3 className="font-serif text-sm font-bold text-[#24231F] mb-1.5">{faq.question}</h3>
                  <p className="text-xs sm:text-sm text-[#5B5449] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Topical Hubs */}
          <div className="border-t border-[#E8E4DC] pt-10">
            <h2 className="font-serif text-xl font-bold text-[#24231F] mb-4">Explore Related Disciplines</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="p-4 rounded-xl bg-white border border-[#E8E4DC] hover:border-[#D5CEBE] transition-all shadow-book flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-[#24231F] hover:text-[#9A704B] transition-colors line-clamp-1">{c.name}</h3>
                    <p className="text-[11px] text-[#81796D] mt-1 line-clamp-2">{c.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-[#9A704B]">
                    <span>View Shelf</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
