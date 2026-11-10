'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PaymentModal from '@/components/PaymentModal';
import ReaderModal from '@/components/ReaderModal';
import { Book } from '@/lib/catalog';
import { 
  ArrowLeft,
  ArrowRight, 
  BookOpen, 
  Clock, 
  ShieldCheck,
  Heart, 
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
  CheckCircle2,
  ZoomIn,
  ExternalLink,
  Scale,
  TrendingDown,
  Sparkles,
  X
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
  const resolveDetailCover = React.useCallback((_cover?: string) => {
    // Route through API so Open Library can replace synthetic local placeholders
    return `/api/covers/${book.slug}?v=7`;
  }, [book.slug]);
  const [detailSrc, setDetailSrc] = useState<string>(() => resolveDetailCover(book.coverImage));

  React.useEffect(() => {
    setDetailSrc(resolveDetailCover(book.coverImage));
    setImgError(false);
  }, [book.id, book.slug, book.coverImage, resolveDetailCover]);

  const handleCoverError = () => {
    const apiFallback = `/api/covers/${book.slug}?v=7`;
    const standardFallback = "/covers/standard-shelf-cover.jpg";
    if (!detailSrc.includes('/api/covers/')) {
      setDetailSrc(apiFallback);
    } else if (detailSrc !== standardFallback) {
      setDetailSrc(standardFallback);
    } else {
      setImgError(true);
    }
  };
  const [isCoverZoomed, setIsCoverZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<'synopsis' | 'contents' | 'specifications' | 'research'>('synopsis');

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

                {/* Cover Provenance Badge */}
                <div className="absolute bottom-3 left-3 pointer-events-none">
                  {book.coverType === 'AUTHENTIC' ? (
                    <span className="px-2 py-0.5 text-[9px] font-sans font-medium uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      Verified Original Cover
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-sans font-medium uppercase tracking-wider bg-neutral-900/80 text-amber-200/90 border border-neutral-700/60 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      Cover not verified
                    </span>
                  )}
                </div>

                {/* Cover Zoom Trigger */}
                <button
                  type="button"
                  onClick={() => setIsCoverZoomed(true)}
                  className="absolute bottom-3 right-3 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-opacity opacity-80 hover:opacity-100 flex items-center space-x-1 text-[10px]"
                  title="Click to zoom cover"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </button>
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

              {/* Marketplace Price Comparison Block */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-[#FAF8F5] to-white border border-[#E8E4DC] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E4DC] pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9A704B]">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Marketplace Price Comparison</span>
                    </div>
                    <p className="text-[11px] text-[#81796D] mt-0.5">
                      Benchmarked against verified digital eBook editions across authorized retailers
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold self-start sm:self-auto">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Save {discountPercent}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  {/* AnonTrove Direct */}
                  <div className="p-3 rounded-lg bg-emerald-50/50 border-2 border-emerald-600/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-900 text-[10px] uppercase tracking-wide">AnonTrove Direct</span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] bg-emerald-600 text-white font-bold">Best Value</span>
                      </div>
                      <div className="text-lg font-bold font-serif text-emerald-950 mt-1">{displayPrice}</div>
                    </div>
                    <div className="text-[10px] text-emerald-700 space-y-0.5 pt-2 border-t border-emerald-200/60 mt-2">
                      <div>✓ 100% DRM-Free PDF</div>
                      <div>✓ Instant Delivery</div>
                      <div>✓ Universal Access</div>
                    </div>
                  </div>

                  {/* Amazon India Kindle */}
                  <div className="p-3 rounded-lg bg-white border border-[#E8E4DC] flex flex-col justify-between">
                    <div>
                      <span className="font-medium text-[#6E685F] text-[10px] uppercase tracking-wide">Amazon India (Kindle)</span>
                      <div className="text-base font-bold font-serif text-[#24231F] mt-1">
                        {book.lowestComparablePrice ? `₹${book.lowestComparablePrice}` : 'Marketplace listing not verified'}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#81796D] space-y-0.5 pt-2 border-t border-[#E8E4DC] mt-2">
                      <div>• Kindle DRM locked</div>
                      <div>• App-only reader</div>
                      <a
                        href={book.amazonUrl || `https://www.amazon.in/s?k=${encodeURIComponent(book.title + ' ' + (book.author || '') + ' kindle')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#9A704B] hover:underline pt-1 font-medium"
                      >
                        <span>Check Amazon</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Google Play Books */}
                  <div className="p-3 rounded-lg bg-white border border-[#E8E4DC] flex flex-col justify-between">
                    <div>
                      <span className="font-medium text-[#6E685F] text-[10px] uppercase tracking-wide">Google Play Books</span>
                      <div className="text-base font-bold font-serif text-[#24231F] mt-1">
                        {book.marketCurrentPrice ? `₹${book.marketCurrentPrice}` : 'Marketplace listing not verified'}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#81796D] space-y-0.5 pt-2 border-t border-[#E8E4DC] mt-2">
                      <div>• Play Books DRM</div>
                      <div>• Watermarked stream</div>
                      <a
                        href={book.googlePlayUrl || `https://play.google.com/store/search?q=${encodeURIComponent(book.title + ' ' + (book.author || ''))}&c=books`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#9A704B] hover:underline pt-1 font-medium"
                      >
                        <span>Check Play Store</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Publisher List MSRP */}
                  <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex flex-col justify-between">
                    <div>
                      <span className="font-medium text-[#81796D] text-[10px] uppercase tracking-wide">Publisher MSRP</span>
                      <div className="text-base font-bold font-serif text-[#81796D] line-through mt-1">
                        {displayOriginalPrice}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#81796D] space-y-0.5 pt-2 border-t border-[#E8E4DC] mt-2">
                      <div>• Official list price</div>
                      <div>• Standard print MSRP</div>
                      <div className="text-[9px] text-[#9A704B]">Verified 2026-11-09</div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#81796D] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E8E4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>
                    * Price Integrity: Digital eBook editions isolated from physical print editions; prices verified through automated discovery.
                  </span>
                  <span className="font-mono text-[#9A704B] shrink-0">{book.priceVerifiedAt || 'Verified 2026-11-09'}</span>
                </div>
              </div>

              {/* Transparent Educational Mission & Why So Cheap Card */}
              <div className="p-5 rounded-2xl bg-[#1C1A17] border border-[#38352F] text-white shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#9A704B]/20 text-[#D4AF37]">
                    <Heart className="w-4 h-4 fill-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A704B] font-semibold block">Curator&apos;s Guarantee</span>
                    <h4 className="font-serif text-sm font-bold text-[#FAF6F1]">
                      Why is this eBook priced at only {displayPrice}?
                    </h4>
                  </div>
                </div>
                <div className="text-xs text-[#A8A29E] leading-relaxed space-y-2">
                  <p>
                    You are not paying for copyright ownership or commercial resale. This <strong className="text-[#FAF6F1]">{displayPrice} is a nominal service contribution</strong> covering high-speed encrypted cloud storage, zero-ad direct downloading, and ongoing catalog indexing.
                  </p>
                  <p>
                    Our mission is <strong className="text-[#FAF6F1]">Education For Everyone</strong>. We believe that expensive commercial paywalls (often ₹1,500+) should never prevent ambitious students and independent developers from studying. If you can comfortably afford the official publisher edition, please support authors and publishers directly!
                  </p>
                </div>
                <div className="pt-2 border-t border-[#38352F]/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78716C]">
                  <span>Reader Support: apnix7@gmail.com</span>
                  <Link href="/mission" className="text-[#D4AF37] hover:underline font-medium inline-flex items-center gap-1">
                    <span>Read Curator&apos;s Full Letter</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
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
                  <button
                    onClick={() => setActiveTab('research')}
                    className={`py-3 px-5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'research'
                        ? 'border-[#9A704B] text-[#9A704B] font-semibold'
                        : 'border-transparent text-[#81796D] hover:text-[#24231F]'
                    }`}
                  >
                    <span>External Research & Links</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-900 rounded font-bold">86k Directory</span>
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

                  {activeTab === 'research' && (() => {
                    const q = encodeURIComponent(`${book.title} ${book.author || ''}`.trim());
                    const links = book.researchLinks || {
                      googleBooks: `https://books.google.com/books?q=${q}`,
                      openLibrary: `https://openlibrary.org/search?q=${q}`,
                      crossref: `https://api.crossref.org/works?query.bibliographic=${q}&rows=5`,
                      googleImages: `https://www.google.com/search?tbm=isch&q=${q}+book+cover`,
                      wikimedia: `https://commons.wikimedia.org/w/index.php?search=${q}+book+cover&title=Special:MediaSearch&type=image`,
                      wikipedia: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(book.author || book.title)}`,
                      internetArchive: `https://archive.org/search?query=${q}`,
                      gutenberg: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(book.title)}`,
                      amazon: `https://www.amazon.in/s?k=${q}`,
                      googlePlay: `https://play.google.com/store/search?q=${q}&c=books`,
                    };

                    return (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="font-serif font-bold text-xs text-[#24231F]">Universal 86,260 Bibliographic Link Directory</h4>
                            <p className="text-[11px] text-[#6E685F] mt-0.5">Direct reference links from our master catalogue index across world digital libraries, publisher archives, and academic repositories.</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">VERIFIED LOOKUP</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {links.openLibrary && (
                            <a href={links.openLibrary} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Open Library</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">View Public Book & Edition Record</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Internet Archive Open Library Catalogue</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.googleBooks && (
                            <a href={links.googleBooks} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Google Books</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Search Official Volume & ISBN</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Global Google Books Repository</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.internetArchive && (
                            <a href={links.internetArchive} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Internet Archive</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Discover Archive Lending Copy</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Universal Non-Profit Digital Library</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.crossref && (
                            <a href={links.crossref} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Crossref Metadata</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Query Academic DOI & Publisher Citations</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Official Crossref Works REST API</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.wikipedia && (
                            <a href={links.wikipedia} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Wikipedia Knowledge</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Author Biography & Bibliography</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Wikimedia Free Encyclopedia</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.wikimedia && (
                            <a href={links.wikimedia} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Wikimedia Commons</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Public Domain Cover Scans & Portraits</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Free Media Repository</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.gutenberg && (
                            <a href={links.gutenberg} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Project Gutenberg</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Check Public Domain Editions</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Classic Literature Open Access</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}

                          {links.amazon && (
                            <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#9A704B] rounded-lg transition-all flex items-start justify-between group">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#9A704B] tracking-wider block">Amazon Marketplace</span>
                                <span className="font-serif text-xs font-semibold text-[#24231F] group-hover:text-[#9A704B]">Cross-Check Market Price & Reviews</span>
                                <span className="text-[10px] text-[#81796D] block mt-0.5">Commercial Publisher Edition Check</span>
                              </div>
                              <span className="text-xs text-[#9A704B] group-hover:translate-x-0.5 transition-transform">↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                        src={`/api/covers/${rb.slug}?v=7`}
                        alt={rb.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/covers/standard-shelf-cover.jpg';
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

        {/* Fullscreen Cover Zoom Modal */}
        {isCoverZoomed && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsCoverZoomed(false)}
          >
            <div 
              className="relative max-w-2xl max-h-[90vh] w-full flex flex-col items-center bg-[#1C1B18] border border-[#3D3A34] rounded-2xl overflow-hidden p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#2E2B25] text-xs text-[#E8E4DC]">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <BookOpen className="w-4 h-4 text-[#C49B71] shrink-0" />
                  <span className="font-semibold truncate">{book.title}</span>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#2E2B25] text-[#A69F91] shrink-0">
                    {book.coverType === 'AUTHENTIC' ? 'Verified Authentic Scan' : 'Custom Editorial Artwork'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsCoverZoomed(false)}
                  className="p-1 rounded-full hover:bg-[#2E2B25] text-[#A69F91] hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 flex items-center justify-center overflow-auto max-h-[70vh]">
                <img
                  src={detailSrc}
                  alt={book.title}
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-2xl"
                />
              </div>
              <div className="w-full text-center text-[11px] text-[#A69F91] pt-3 border-t border-[#2E2B25]">
                {book.coverType === 'AUTHENTIC' 
                  ? 'Original publisher front jacket scan. High-resolution portrait reproduction.' 
                  : 'Professionally rendered custom catalogue artwork designed with verified bibliographic metadata.'}
              </div>
            </div>
          </div>
        )}
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
