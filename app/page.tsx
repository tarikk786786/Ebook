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
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);

  const categories = ['All', 'Security & Privacy', 'FinTech & Engineering', 'Indie Hacking', 'Architecture'];

  const filteredBooks = useMemo(() => {
    return BOOK_CATALOG.filter((book) => {
      const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-800/80">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-emerald-400 font-semibold">Trove v2.0 Architecture</span>
              <span className="text-slate-600">•</span>
              <span>100% Free Resources (GitHub + Vercel)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Curated Engineering Manuals.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Tracking.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Acquire and download production-grade software guides via direct 0% fee UPI. 
              No accounts, zero telemetry, and ephemeral AES-256 encrypted links.
            </p>

            {/* Quick Feature Metric Ribbon */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#121826] border border-slate-800 text-left">
                <span className="text-[10px] text-slate-500 font-mono block">COMMISSION</span>
                <span className="text-base font-bold text-white font-mono">0.0% Forever</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121826] border border-slate-800 text-left">
                <span className="text-[10px] text-slate-500 font-mono block">SETTLEMENT</span>
                <span className="text-base font-bold text-emerald-400 font-mono">0 Seconds (P2P)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121826] border border-slate-800 text-left">
                <span className="text-[10px] text-slate-500 font-mono block">PII DATA HELD</span>
                <span className="text-base font-bold text-white font-mono">0 Bytes</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121826] border border-slate-800 text-left">
                <span className="text-[10px] text-slate-500 font-mono block">LINK ENCRYPTION</span>
                <span className="text-base font-bold text-cyan-400 font-mono">AES-256-GCM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Shelf Section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter & Mobile Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Available Digital Editions</h2>
              <p className="text-xs text-slate-400 mt-1">Select an eBook to sample chapters in the interactive reader or buy immediately</p>
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

          {/* Book Cards Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Security & Cryptographic Inspector */}
        <SecurityInspector />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">AnonTrove</span> • Open-Source EBook & PDF Storefront
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Non-Custodial UPI Settlement</span>
            <span>•</span>
            <span>Sec. 22 CGST Exempt</span>
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
