'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PdfReader from '@/components/reader/PdfReader';
import EpubReader from '@/components/reader/EpubReader';
import { BOOK_CATALOG, Book } from '@/lib/catalog';
import { 
  BookOpen, 
  ArrowLeft, 
  Search, 
  Download, 
  Play, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Layers, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface PurchasedItem {
  book: Book;
  format: 'PDF' | 'EPUB';
  progressPercent: number;
  lastReadDate: string;
  orderNumber: string;
}

export default function CustomerLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReadingItem, setActiveReadingItem] = useState<PurchasedItem | null>(null);

  // Default sample library populated from verified catalog bestsellers
  const purchasedItems: PurchasedItem[] = [
    {
      book: BOOK_CATALOG.find(b => b.id === 'book-basics-of-equity-research-by-zebra-learn') || BOOK_CATALOG[0],
      format: 'PDF',
      progressPercent: 68,
      lastReadDate: 'Today',
      orderNumber: 'ORD-982143',
    },
    {
      book: BOOK_CATALOG.find(b => b.id === 'book-101-linux-commands') || BOOK_CATALOG[1],
      format: 'PDF',
      progressPercent: 32,
      lastReadDate: 'Yesterday',
      orderNumber: 'ORD-982143',
    },
    {
      book: BOOK_CATALOG.find(b => b.id === 'book-10-trading-strategies-by-aseem-singhal') || BOOK_CATALOG[2],
      format: 'EPUB',
      progressPercent: 100,
      lastReadDate: '3 days ago',
      orderNumber: 'ORD-761209',
    },
    {
      book: BOOK_CATALOG.find(b => b.id === 'book-010-cyber-security-notes-cybersecurity-day-2p') || BOOK_CATALOG[3],
      format: 'PDF',
      progressPercent: 15,
      lastReadDate: '1 week ago',
      orderNumber: 'ORD-549102',
    },
  ];

  const filteredItems = purchasedItems.filter(item => 
    item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {activeReadingItem ? (
        activeReadingItem.format === 'PDF' ? (
          <PdfReader
            title={activeReadingItem.book.title}
            author={activeReadingItem.book.author}
            streamUrl={`/api/download/sample-stream-token?book_id=${encodeURIComponent(activeReadingItem.book.id)}`}
            watermarkText={`Licensed to Customer • Order #${activeReadingItem.orderNumber}`}
            allowDownload={true}
            onClose={() => setActiveReadingItem(null)}
          />
        ) : (
          <EpubReader
            title={activeReadingItem.book.title}
            author={activeReadingItem.book.author}
            streamUrl={`/api/download/sample-stream-token?book_id=${encodeURIComponent(activeReadingItem.book.id)}`}
            watermarkText={`Licensed to Customer • Order #${activeReadingItem.orderNumber}`}
            allowDownload={true}
            onClose={() => setActiveReadingItem(null)}
          />
        )
      ) : (
        <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col justify-between">
          <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Top Breadcrumb & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Bookstore</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">My Digital Reading Vault</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
                    {purchasedItems.length} Titles Owned
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  100% DRM-Free • Instant in-browser reader with cross-device reading progress.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/orders"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold transition-colors"
                >
                  Order History & Invoices
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  + Add More Books
                </Link>
              </div>
            </div>

            {/* Grid of Purchased Books */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.book.id}
                  className="bg-[#111724] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xl group"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 shadow-md mb-3">
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center space-x-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold uppercase">
                          {item.format}
                        </span>
                        {item.progressPercent === 100 && (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-mono font-bold flex items-center space-x-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Finished</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.book.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">By {item.book.author}</p>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Progress</span>
                        <span>{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => setActiveReadingItem(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{item.progressPercent > 0 ? 'Continue' : 'Start Reading'}</span>
                    </button>

                    <a
                      href={`/api/download/sample-stream-token?book_id=${encodeURIComponent(item.book.id)}`}
                      download
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
