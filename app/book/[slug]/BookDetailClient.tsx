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
  Star, 
  Clock, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Share2, 
  Send,
  Eye,
  Check,
  Smartphone,
  Tablet,
  Laptop,
  ShoppingBag
} from 'lucide-react';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';

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
  const [cartOrder, setCartOrder] = useState<any>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
      />

      <main className="flex-1 pb-20">
        {/* Breadcrumb Header */}
        <div className="border-b border-slate-800/80 bg-slate-900/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Digital Bookstore</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Book Detail Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: 3D Book Cover & Fast Actions (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[360px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl shadow-emerald-950/20">
                {!imgError ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 flex flex-col justify-between border border-slate-700">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <BookOpen className="w-6 h-6" />
                      <span className="font-mono text-xs uppercase font-bold tracking-wider">Digital Edition</span>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-400 font-mono font-semibold">{book.edition}</span>
                      <h2 className="text-xl font-black text-white mt-1 leading-snug">{book.title}</h2>
                      <p className="text-sm text-slate-300 mt-2">By {book.author}</p>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {book.pages} Pages • DRM-Free
                    </div>
                  </div>
                )}

                {/* Realistic Book Spine Shadow */}
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-4 w-[1px] bg-white/20 pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 rounded-lg">
                    {book.category}
                  </span>
                  {book.badge && (
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-lg shadow-lg">
                      {book.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Action Preview Button */}
              <div className="w-full max-w-[360px] mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsPreviewing(true)}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Look Inside Excerpt</span>
                </button>

                <button
                  onClick={() => setIsBuying(true)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Get Book {displayPrice}</span>
                </button>
              </div>

              {/* Device Compatibility */}
              <div className="w-full max-w-[360px] mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-mono text-[11px] uppercase text-slate-400 font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zero DRM • Instant Universal Delivery</span>
                </div>
                <div className="flex items-center space-x-4 text-[11px] text-slate-300 pt-1">
                  <span className="flex items-center space-x-1">
                    <Tablet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kindle / Kobo</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>iPad / Mobile</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mac / PC</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Complete Book Information & Telegram Provenance (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                    {(book.primaryResourceType || 'Resource').replace(/_/g, ' ')}
                  </span>
                  {book.publisher && ['published_ebook', 'textbook', 'professional_book'].includes(book.primaryResourceType || '') && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
                      {book.publisher}
                    </span>
                  )}
                  {book.isCustomGenerated && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-400 font-mono text-xs">
                      Honest Custom Thumbnail
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  {book.title}
                </h1>
                
                {book.subtitle && (
                  <p className="text-base sm:text-lg text-emerald-400/90 font-medium mt-1">
                    {book.subtitle}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span>By <strong className="text-slate-200">{book.author}</strong></span>
                  <span className="text-slate-600">•</span>
                  <div className="flex items-center space-x-1 text-amber-400">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-200">{book.rating}</span>
                    <span className="text-slate-500">({book.reviewCount} reviews)</span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center space-x-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{book.readingTime} reading time</span>
                  </span>
                </div>
              </div>

              {/* Purchase Card */}
              <div className="p-5 rounded-2xl bg-[#121826] border border-slate-700/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-white font-mono">{displayPrice}</span>
                    <span className="text-sm text-slate-500 line-through">{displayOriginalPrice}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                      SAVE {discountPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Single payment • 0% Transaction fees • Instant secure link
                  </p>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => addToCart(book)}
                    className={`px-4 py-3.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                      isInCart
                        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>{isInCart ? 'In Cart' : '+ Cart'}</span>
                  </button>

                  <button
                    onClick={() => setIsBuying(true)}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Instant Checkout</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Overview & Editorial Synopsis</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Telegram Source & Security Provenance Box */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Telegram Provenance & File Integrity</span>
                  </div>
                  {book.telegramLink && (
                    <a
                      href={book.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-emerald-400 transition-colors"
                    >
                      <span>Open in Telegram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Source Channel</span>
                    <strong className="text-slate-200 line-clamp-1">{book.sourceTelegram || 'Telegram Vault'}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Telegram Msg ID</span>
                    <strong className="text-slate-200 font-mono">#{book.telegramMessageId || 'Direct'}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Format & Size</span>
                    <strong className="text-slate-200 font-mono">{book.format} • {book.fileSize}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">Page Count</span>
                    <strong className="text-slate-200 font-mono">{book.pages} Pages</strong>
                  </div>
                </div>

                {book.sha256 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-500">SHA-256 Checksum:</span>
                    <span className="text-slate-300 truncate max-w-[280px]">{book.sha256}</span>
                  </div>
                )}
              </div>

              {/* Table of Contents */}
              {book.tableOfContents && book.tableOfContents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Curriculum & Table of Contents</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {book.tableOfContents.map((chapter, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 flex items-center space-x-2">
                        <span className="flex h-5 w-5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="line-clamp-1">{chapter}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Excerpt Reader */}
              {book.sampleExcerpt && book.sampleExcerpt.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Free Excerpt Sample</span>
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 leading-relaxed font-serif space-y-2">
                    {book.sampleExcerpt.map((para, i) => (
                      <p key={i} className="italic text-slate-300">
                        &ldquo;{para}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Related Books Grid */}
          {relatedBooks.length > 0 && (
            <div className="mt-16 pt-12 border-t border-slate-800">
              <h2 className="text-xl font-black text-white tracking-tight mb-6">
                Related Books in <span className="text-emerald-400">{book.category}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedBooks.map((relBook) => (
                  <Link
                    key={relBook.id}
                    href={`/book/${relBook.slug}`}
                    className="group bg-[#121826] border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                      <img
                        src={relBook.coverImage}
                        alt={relBook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase bg-black/80 text-emerald-300 rounded">
                        {relBook.category}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {relBook.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">By {relBook.author}</p>
                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <span className="font-mono font-bold text-emerald-400">₹{relBook.priceInInr}</span>
                        <span className="text-slate-500 text-[10px] font-mono">{relBook.pages} pgs</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reader Modal */}
      {isPreviewing && (
        <ReaderModal
          book={book}
          onClose={() => setIsPreviewing(false)}
          onBuy={() => {
            setIsPreviewing(false);
            setIsBuying(true);
          }}
        />
      )}

      {/* Slide-Over Multi-Item Shopping Cart Drawer */}
      <CartDrawer 
        onStartCheckout={(orderData) => {
          setCartOrder(orderData);
        }} 
      />

      {/* Dynamic UPI QR & Redirect Payment Modal */}
      {(isBuying || cartOrder) && (
        <PaymentModal
          book={isBuying ? book : null}
          initialOrder={cartOrder}
          onClose={() => {
            setIsBuying(false);
            setCartOrder(null);
          }}
        />
      )}
    </>
  );
}
