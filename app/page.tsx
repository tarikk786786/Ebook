'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import PreviewModal from '@/components/PreviewModal';
import PaymentModal from '@/components/PaymentModal';
import FaqSection from '@/components/FaqSection';
import { BOOK_CATALOG, Book } from '@/lib/catalog';
import { ShieldCheck, Zap, Lock, Sparkles, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);

  const categories = ['All', 'Security & Privacy', 'FinTech & Engineering', 'Indie Hacking', 'Architecture'];

  const filteredBooks = selectedCategory === 'All'
    ? BOOK_CATALOG
    : BOOK_CATALOG.filter(b => b.category === selectedCategory);

  return (
    <>
      <Navbar />

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
              Curated eBooks & Technical Guides.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Tracking.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Buy and download high-impact engineering manuals and digital PDFs via FamGateway 0% fee UPI. 
              No accounts, no third-party trackers, and ephemeral AES-256 encrypted links.
            </p>

            {/* Quick Feature Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>0-Second P2P UPI Settlement</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Database PII Storage</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#121826] border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>HMAC-SHA256 Webhooks</span>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Shelf Section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Available Digital Editions</h2>
              <p className="text-xs text-slate-400 mt-1">Select an eBook to preview sample chapters or purchase immediately</p>
            </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelectBuy={(b) => setBuyingBook(b)}
                onSelectPreview={(b) => setPreviewBook(b)}
              />
            ))}
          </div>
        </section>

        {/* Trove Architecture Highlight */}
        <section className="py-12 bg-[#0E131F] border-y border-slate-800/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#121826] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                    <Terminal className="w-4 h-4" />
                    <span>How Zero-Trace Works</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Non-Custodial Payments + Single-Use Streaming
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Unlike standard web stores that record your IP address, credit cards, and email onto permanent advertising databases, AnonTrove pairs FamGateway's direct bank-to-bank UPI rail with client-side AES-256 tokenization. No tracking scripts. No cookies.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-300 bg-[#0B0F17] p-4 rounded-2xl border border-slate-800 shrink-0">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Hosted on Vercel Free Tier</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>FamGateway 0% Fee UPI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Timing-Safe HMAC Validation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>24h Auto-Decaying Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
            <span>Payments by <strong className="text-slate-300">FamGateway</strong> (MSME Reg: UDYAM-BR-28-0050000)</span>
            <span>•</span>
            <span>Sec. 22 CGST Exempt</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PreviewModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBuy={(book) => {
          setPreviewBook(null);
          setBuyingBook(book);
        }}
      />

      <PaymentModal
        book={buyingBook}
        onClose={() => setBuyingBook(null)}
      />
    </>
  );
}
