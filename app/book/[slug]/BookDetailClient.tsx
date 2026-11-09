'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PaymentModal from '@/components/PaymentModal';
import ReaderModal from '@/components/ReaderModal';
import { Book } from '@/lib/catalog';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Zap, 
  Layers, 
  Share2, 
  Eye,
  Check,
  Smartphone,
  Tablet,
  Laptop,
  ShoppingBag,
  Award,
  CheckCircle2
} from 'lucide-react';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';

interface BookDetailClientProps {
  book: Book;
  relatedBooks: Book[];
}

export default function BookDetailClient({ book, relatedBooks }: BookDetailClientProps) {
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [detailSrc, setDetailSrc] = useState<string>(book.coverImage || `/api/covers/${book.slug}`);

  React.useEffect(() => {
    setDetailSrc(book.coverImage || `/api/covers/${book.slug}`);
    setImgError(false);
  }, [book.id, book.slug, book.coverImage]);

  const handleCoverError = () => {
    const apiFallback = `/api/covers/${book.slug}`;
    const standardFallback = "/covers/standard-shelf-cover.jpg";
    if (detailSrc !== apiFallback) {
      setDetailSrc(apiFallback);
    } else if (detailSrc !== standardFallback) {
      setDetailSrc(standardFallback);
    } else {
      setImgError(true);
    }
  };
  const [activeTab, setActiveTab] = useState<'synopsis' | 'contents' | 'specifications'>('synopsis');

  React.useEffect(() => {
    trackViewItem({
      id: book.id,
      name: book.title,
      price: book.priceInInr,
      category: book.category,
      currency: 'INR'
    });
  }, [book]);

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  const discountPercent = Math.round(
    ((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100
  );

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddToCart = () => {
    addToCart(book);
    trackAddToCart({
      id: book.id,
      name: book.title,
      price: book.priceInInr,
      category: book.category,
      currency: 'INR'
    });
  };

  const chapters = book.tableOfContents && book.tableOfContents.length > 0
    ? book.tableOfContents
    : [
        '1. Architecture Fundamentals & Core Foundations',
        '2. Implementation Patterns & Design Principles',
        '3. Practical Production Engineering & Optimization',
        '4. Hands-on Case Studies & Advanced Reference'
      ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
      />

      <main className="flex-1 pb-20">
        {/* Editorial Breadcrumb Navigation */}
        <div className="border-b border-[#E8E4DC] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-[#81796D]">
            <Link 
              href="/#catalog" 
              className="inline-flex items-center space-x-1.5 hover:text-[#24231F] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </Link>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline text-[#81796D]">{book.category}</span>
              <button
                onClick={handleShare}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white text-xs text-[#6E685F] hover:text-[#24231F] transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-[#9A704B]" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Product Showcase */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left: Book Jacket Showcase (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-lg overflow-hidden bg-white border border-[#E8E4DC] shadow-book hover:shadow-book-hover transition-all">
                {!imgError ? (
                  <img
                    src={detailSrc}
                    alt={book.title}
                    onError={handleCoverError}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FAF8F5] p-6 flex flex-col justify-between border border-[#E8E4DC]">
                    <div className="flex items-center space-x-2 text-[#81796D]">
                      <BookOpen className="w-4 h-4 text-[#9A704B]" />
                      <span className="font-sans text-[11px] uppercase font-medium tracking-wider">
                        {book.format || 'PDF'} Edition
                      </span>
                    </div>
                    <div>
                      <h2 className="font-serif text-base font-bold text-[#24231F] leading-snug">{book.title}</h2>
                      <p className="text-xs text-[#81796D] mt-2">By {book.author}</p>
                    </div>
                    <div className="text-xs text-[#81796D] font-mono">
                      {book.pages} Pages • DRM-Free
                    </div>
                  </div>
                )}

                {/* Subtle book spine edge shadow */}
                <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 text-[9px] font-sans font-medium uppercase tracking-wider bg-white/95 text-[#24231F] border border-[#E8E4DC] rounded shadow-sm">
                    {book.format || 'PDF'}
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC] rounded">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Under Cover */}
              <div className="w-full max-w-[340px] mt-4 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsPreviewing(true)}
                  className="py-2.5 px-3 rounded-lg border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-[#24231F] text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-[#9A704B]" />
                  <span>Preview Excerpt</span>
                </button>

                <button
                  onClick={() => setIsBuying(true)}
                  className="py-2.5 px-3 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Buy Now ({displayPrice})</span>
                </button>
              </div>

              {/* Device Compatibility Card */}
              <div className="w-full max-w-[340px] mt-5 p-4 rounded-xl bg-white border border-[#E8E4DC] text-xs text-[#6E685F] space-y-2.5 shadow-book">
                <div className="text-[11px] font-sans uppercase text-[#24231F] font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#9A704B]" />
                  <span>Universal DRM-Free Guarantee</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#81796D] pt-1 border-t border-[#E8E4DC]">
                  <span className="flex items-center space-x-1">
                    <Tablet className="w-3.5 h-3.5 text-[#9A704B]" />
                    <span>Kindle / E-Reader</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-[#9A704B]" />
                    <span>iPad / Phone</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Laptop className="w-3.5 h-3.5 text-[#9A704B]" />
                    <span>Mac / PC</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Editorial Metadata & Ordering (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E4DC] text-[#81796D] text-[11px] font-sans font-medium">
                    {book.category}
                  </span>
                  {book.publisher && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E4DC] text-[#81796D] text-[11px] font-sans font-medium">
                      Published by {book.publisher}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] text-[11px] font-sans font-semibold">
                    In Stock • Instant Delivery
                  </span>
                </div>

                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#24231F] tracking-tight leading-tight">
                  {book.title}
                </h1>

                {book.subtitle && (
                  <p className="font-serif text-base sm:text-lg text-[#6E685F] leading-snug">
                    {book.subtitle}
                  </p>
                )}

                <div className="text-xs text-[#81796D] flex items-center gap-3 pt-1">
                  <span>Author: <strong className="text-[#24231F]">{book.author || 'AnonTrove Editorial'}</strong></span>
                  <span>•</span>
                  <span>{book.pages} Pages</span>
                  <span>•</span>
                  <span>{book.format || 'PDF'}</span>
                </div>
              </div>

              {/* Pricing Box & Add to Bag */}
              <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-book space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-serif text-3xl font-bold text-[#24231F]">{displayPrice}</span>
                    {book.originalPriceInInr > book.priceInInr && (
                      <span className="ml-2 text-sm text-[#81796D] line-through">{displayOriginalPrice}</span>
                    )}
                    <span className="ml-2 text-xs font-medium text-[#835C3A] bg-[#FAF6F1] px-2 py-0.5 rounded border border-[#F2E8DC]">
                      Save {discountPercent}%
                    </span>
                  </div>
                  <span className="text-xs text-[#81796D]">Includes all study chapters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className="py-3 px-4 rounded-lg border border-[#E8E4DC] hover:border-[#D5CEBE] bg-white hover:bg-[#FAF8F5] text-[#24231F] text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    {isInCart ? <Check className="w-4 h-4 text-[#9A704B]" /> : <ShoppingBag className="w-4 h-4" />}
                    <span>{isInCart ? 'Added to Bag' : 'Add to Reading Bag'}</span>
                  </button>

                  <button
                    onClick={() => setIsBuying(true)}
                    className="py-3 px-4 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Instant UPI Buy</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E8E4DC] flex items-center justify-between text-[11px] text-[#81796D]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B]" /> Instant Email Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B]" /> In-Browser Cloud Reader
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B]" /> 100% Money-Back Guarantee
                  </span>
                </div>
              </div>

              {/* Tabs: Synopsis, Contents, Specifications */}
              <div className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden shadow-book">
                <div className="flex border-b border-[#E8E4DC] text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('synopsis')}
                    className={`py-3 px-5 border-b-2 transition-colors ${
                      activeTab === 'synopsis'
                        ? 'border-[#24231F] text-[#24231F] font-semibold'
                        : 'border-transparent text-[#81796D] hover:text-[#24231F]'
                    }`}
                  >
                    Synopsis & Value
                  </button>
                  <button
                    onClick={() => setActiveTab('contents')}
                    className={`py-3 px-5 border-b-2 transition-colors ${
                      activeTab === 'contents'
                        ? 'border-[#24231F] text-[#24231F] font-semibold'
                        : 'border-transparent text-[#81796D] hover:text-[#24231F]'
                    }`}
                  >
                    Table of Contents
                  </button>
                  <button
                    onClick={() => setActiveTab('specifications')}
                    className={`py-3 px-5 border-b-2 transition-colors ${
                      activeTab === 'specifications'
                        ? 'border-[#24231F] text-[#24231F] font-semibold'
                        : 'border-transparent text-[#81796D] hover:text-[#24231F]'
                    }`}
                  >
                    Technical Specs
                  </button>
                </div>

                <div className="p-6 text-xs sm:text-sm text-[#5B5449] leading-relaxed">
                  {activeTab === 'synopsis' && (
                    <div className="space-y-4">
                      <p>{book.description}</p>
                      
                      {book.authorProfile && (
                        <div className="p-4 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl flex items-start gap-4 mt-4">
                          {book.authorProfile.photoUrl && (
                            <img
                              src={book.authorProfile.photoUrl}
                              alt={book.authorProfile.name}
                              className="w-14 h-14 rounded-full object-cover border border-[#E8E4DC] shrink-0"
                            />
                          )}
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#9A704B]">About the Author</span>
                            <h4 className="font-serif font-bold text-sm text-[#24231F]">{book.authorProfile.name}</h4>
                            <p className="text-xs text-[#6E685F] leading-relaxed">{book.authorProfile.shortBio}</p>
                            {book.authorProfile.wikipediaUrl && (
                              <a
                                href={book.authorProfile.wikipediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] text-[#9A704B] hover:underline gap-1 mt-1 font-medium"
                              >
                                View Wikipedia Profile →
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg space-y-2 mt-4">
                        <span className="font-serif font-bold text-xs text-[#24231F] block">Who This Guide Is For:</span>
                        <ul className="space-y-1.5 text-xs text-[#6E685F]">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B] shrink-0 mt-0.5" />
                            <span>Software engineers, students, and practitioners looking for clean, verified technical references.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B] shrink-0 mt-0.5" />
                            <span>Readers who prefer distraction-free, DRM-free digital formats without subscription paywalls.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contents' && (
                    <ul className="space-y-2">
                      {chapters.map((ch, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2.5 rounded bg-[#FAF8F5] border border-[#E8E4DC]/80 text-xs text-[#24231F]">
                          <span className="font-serif font-medium">{ch}</span>
                          <span className="text-[10px] font-mono text-[#81796D]">Included</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'specifications' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Format</span>
                        <strong className="text-[#24231F] font-mono">{book.format || 'PDF (Universal)'}</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Page Count</span>
                        <strong className="text-[#24231F] font-mono">{book.pages} Pages</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Language</span>
                        <strong className="text-[#24231F] font-mono">{book.language || 'English (En-US)'}</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Publisher</span>
                        <strong className="text-[#24231F] truncate block" title={book.publisher || 'AnonTrove Press'}>{book.publisher || 'AnonTrove Press'}</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Publication Year</span>
                        <strong className="text-[#24231F] font-mono">{book.publicationYear || book.publishedYear || '2024'}</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">ISBN-13</span>
                        <strong className="text-[#24231F] font-mono">{book.isbn13 || book.isbn || 'Verified Digital ID'}</strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">Catalog Verification</span>
                        <strong className="text-emerald-700 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {book.verificationStatus || 'VERIFIED'}
                        </strong>
                      </div>
                      <div className="p-3 bg-[#FAF8F5] rounded border border-[#E8E4DC]">
                        <span className="text-[#81796D] block text-[10px] uppercase">DRM Protection</span>
                        <strong className="text-[#9A704B] font-mono">None (100% DRM-Free)</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Ebooks Collection */}
          {relatedBooks && relatedBooks.length > 0 && (
            <div className="mt-16 pt-10 border-t border-[#E8E4DC]">
              <div className="mb-6">
                <span className="text-xs font-sans uppercase tracking-wider text-[#81796D] font-semibold">
                  Complementary Reading
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#24231F] mt-1">
                  More in {book.category}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedBooks.slice(0, 4).map((rb) => (
                  <Link
                    key={rb.id}
                    href={`/book/${rb.slug}`}
                    className="group bg-white border border-[#E8E4DC] hover:border-[#D5CEBE] rounded-xl p-3 shadow-book hover:shadow-book-hover transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[3/4] rounded overflow-hidden bg-[#FAF8F5] border border-[#E8E4DC] mb-2.5">
                      <img
                        src={rb.coverImage || `/api/covers/${rb.slug}`}
                        alt={rb.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `/api/covers/${rb.slug}`;
                        }}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B] transition-colors line-clamp-2 leading-snug">
                        {rb.title}
                      </h4>
                      <p className="text-[11px] text-[#81796D] line-clamp-1 mt-0.5">{rb.author}</p>
                      <span className="font-serif text-xs font-bold text-[#24231F] block mt-1">₹{rb.priceInInr}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Checkout and Reader Modals */}
      {isBuying && (
        <PaymentModal
          book={book}
          onClose={() => setIsBuying(false)}
        />
      )}

      {isPreviewing && (
        <ReaderModal
          book={book}
          onClose={() => setIsPreviewing(false)}
          onBuy={(b) => {
            setIsPreviewing(false);
            setIsBuying(true);
          }}
        />
      )}

      <CartDrawer onStartCheckout={() => {}} />
    </div>
  );
}
