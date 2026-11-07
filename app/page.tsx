'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import ReaderModal from '@/components/ReaderModal';
import PaymentModal from '@/components/PaymentModal';
import SecurityInspector from '@/components/SecurityInspector';
import FaqSection from '@/components/FaqSection';
import { BOOK_CATALOG, Book } from '@/lib/catalog';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  BookOpen, 
  Star, 
  Search, 
  CheckCircle2, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Download,
  Sparkles,
  ArrowRight,
  Package
} from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(BOOK_CATALOG.map((b) => b.category))).filter(Boolean);
    return ['All', ...cats];
  }, []);

  const filteredBooks = useMemo(() => {
    return BOOK_CATALOG.filter((book) => {
      if (book.id === 'book-master-bundle') return false; // Featured in top banner
      const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Master Bundle Object
  const masterBundleBook: Book = BOOK_CATALOG.find(b => b.id === 'book-master-bundle') || BOOK_CATALOG[0];

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
      />

      <main className="flex-1">
        {/* Bookstore Hero */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-800/80">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-emerald-400 font-semibold">Independent Digital Bookstore</span>
              <span className="text-slate-600">•</span>
              <span>DRM-Free • PDF & EPUB</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Essential Technical Books.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Tracking.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              In-depth engineering manuals and solo founder playbooks delivered directly to your device. 
              No accounts, zero telemetry, and instant encrypted delivery via 0% fee UPI.
            </p>

            {/* Device Compatibility Ribbon */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-y border-slate-800/60 py-3.5 max-w-3xl mx-auto">
              <span className="text-slate-500 text-[11px] uppercase font-mono font-semibold">Compatible with:</span>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Tablet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kindle & e-Readers</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Apple Books & iPad</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Readers (Mac/PC)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>DRM-Free Lifetime Files</span>
              </div>
            </div>
          </div>
        </section>

        {/* Master Bundle Special Offer Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-gradient-to-r from-[#121826] via-[#151D2F] to-[#121826] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-md shadow-sm">
                  Limited Bundle Deal
                </span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">Save 86% Off</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white">
                The Complete 6-Volume Digital Engineering Boxset
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock all 6 published editions (1,046 pages): Security, FinTech UPI, Autonomous AI Agents, Zero-Dollar SaaS, Resilient Microservices, and Technical Copywriting. Includes all PDFs, EPUBs, and code repositories.
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant 1-Click UPI Download</span>
                </span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All Future Revisions Included</span>
                </span>
              </div>
            </div>

            <div className="text-center md:text-right shrink-0 bg-[#0B0F17]/80 p-5 rounded-2xl border border-slate-800 w-full md:w-auto">
              <div className="text-xs text-slate-500 line-through">Regular: ₹2,999.00</div>
              <div className="text-3xl font-black text-white font-mono my-1">
                ₹399.00
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mb-3">0% Fees • Instant Bank Settlement</div>

              <button
                onClick={() => setBuyingBook(masterBundleBook)}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Get Complete Boxset (₹399)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Catalog Shelf Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter & Mobile Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Browse Digital Bookshelf</h2>
              <p className="text-xs text-slate-400 mt-1">Select any eBook to read sample chapters or acquire instantly via UPI</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Vertical Book Cards Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  currency={currency}
                  onSelectBuy={(b) => setBuyingBook(b)}
                  onSelectPreview={(b) => setPreviewBook(b)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[#121826] border border-slate-800 rounded-2xl">
              <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No volumes matched your search</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting keywords or selecting "All" categories</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="py-12 bg-[#0E131F] border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full">
                Simple 3-Step Reading Experience
              </span>
              <h3 className="text-2xl font-bold text-white mt-3">How Buying an eBook Works</h3>
              <p className="text-xs text-slate-400 mt-1">Direct from independent author to your device</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121826] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold">
                  01
                </div>
                <h4 className="text-base font-bold text-white">Choose Your Volume</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click "Look Inside" to preview sample chapters, inspect the table of contents, and verify technical depth in our browser reader.
                </p>
              </div>

              <div className="bg-[#121826] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold">
                  02
                </div>
                <h4 className="text-base font-bold text-white">Instant UPI Scan</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scan the dynamic QR code with any UPI app (GPay, PhonePe, Paytm, Cred). Settle peer-to-peer with 0% gateway commission.
                </p>
              </div>

              <div className="bg-[#121826] border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold">
                  03
                </div>
                <h4 className="text-base font-bold text-white">Read on Any Device</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  An encrypted, single-use stream token delivers your DRM-free PDF and EPUB files immediately. Transfer to Kindle or tablet anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reader Reviews & Testimonials */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full">
              Reader Feedback
            </span>
            <h3 className="text-2xl font-bold text-white mt-3">What Software Engineers & Solo Founders Say</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-slate-300">
                "The Zero-Trace Engineer changed how I design web apps. The chapters on replacing databases with ephemeral AES-256 tokens are worth 10x the price alone."
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                <strong className="text-white block font-medium">Vikram Sen</strong>
                <span className="text-[10px]">Staff Security Engineer</span>
              </div>
            </div>

            <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-slate-300">
                "High-Volume UPI Protocols is the only comprehensive guide on non-custodial Indian payments. Implemented multi-wallet failover pools in an afternoon."
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                <strong className="text-white block font-medium">Aditi Rao</strong>
                <span className="text-[10px]">FinTech Founder</span>
              </div>
            </div>

            <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-slate-300">
                "Zero to Prod got my micro-tool to its first 50 paying users without paying a single dollar for servers. Vercel + UPI checkout is pure magic."
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                <strong className="text-white block font-medium">Rohan Gupta</strong>
                <span className="text-[10px]">Indie Hacker</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Cryptographic Inspector */}
        <SecurityInspector />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Bookstore Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300 text-sm">AnonTrove Bookstore</span>
              <span className="text-slate-600">•</span>
              <span>Independent Digital Publishing Platform</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span>Non-Custodial UPI Settlement</span>
              <span>•</span>
              <span>Sec. 22 CGST Exempt</span>
              <span>•</span>
              <span>Zero-Trace Privacy Engine</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 text-center sm:text-left">
            All eBooks are delivered DRM-free with lifetime personal reading license. Compatible with Amazon Kindle, Apple Books, Kobo, Android, and all standard PDF/EPUB readers.
          </div>
        </div>
      </footer>

      {/* Interactive Reader Modal */}
      <ReaderModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBuy={(book) => {
          setPreviewBook(null);
          setBuyingBook(book);
        }}
      />

      {/* Secure UPI Payment Modal */}
      <PaymentModal
        book={buyingBook}
        onClose={() => setBuyingBook(null)}
      />
    </>
  );
}
