'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  ShoppingBag
} from 'lucide-react';

interface PurchasedItem {
  book: Book;
  format: 'PDF' | 'EPUB';
  progressPercent: number;
  lastReadDate: string;
  orderNumber: string;
  token?: string;
  downloadUrl?: string;
}

export default function CustomerLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReadingItem, setActiveReadingItem] = useState<PurchasedItem | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('anontrove_customer_orders');
        const readingProgressMap: Record<string, number> = (() => {
          try {
            return JSON.parse(localStorage.getItem('anontrove_reading_progress') || '{}');
          } catch {
            return {};
          }
        })();

        if (stored) {
          const orders = JSON.parse(stored);
          if (Array.isArray(orders)) {
            const items: PurchasedItem[] = [];
            const seenBookIds = new Set<string>();

            orders.forEach((ord: any) => {
              if (ord.status === 'PAID' || ord.status === 'SUCCESS' || !ord.status) {
                (ord.items || []).forEach((it: any) => {
                  const targetId = it.bookId || it.id;
                  if (targetId && seenBookIds.has(targetId)) return;
                  if (targetId) seenBookIds.add(targetId);

                  const matched = BOOK_CATALOG.find(b => b.id === targetId || b.slug === targetId) || {
                    id: targetId || `book-${Math.random().toString(36).slice(2, 8)}`,
                    slug: targetId || 'purchased-ebook',
                    title: it.title || 'Purchased Study Guide',
                    subtitle: 'DRM-Free Personal Edition',
                    author: it.author || 'AnonTrove Editorial',
                    description: 'Purchased verified educational digital asset.',
                    priceInInr: it.price || 49,
                    originalPriceInInr: (it.price || 49) * 4,
                    pages: 240,
                    format: (it.format || 'PDF').toUpperCase(),
                    fileSize: 'Standard PDF',
                    category: 'Core Engineering',
                    rating: 4.8,
                    reviewCount: 42,
                    readingTime: '4 hrs',
                    edition: '1st Edition',
                    coverImage: '/covers/standard-shelf-cover.jpg',
                    sampleExcerpt: [],
                    tableOfContents: [],
                    fileName: `${targetId || 'book'}.pdf`,
                  };

                  const progress = readingProgressMap[matched.id] || 0;

                  items.push({
                    book: matched,
                    format: (it.format || 'PDF').toUpperCase() === 'EPUB' ? 'EPUB' : 'PDF',
                    progressPercent: progress,
                    lastReadDate: ord.date || 'Recent',
                    orderNumber: ord.orderNumber || ord.orderId || 'ORD-VERIFIED',
                    token: it.token || ord.token,
                    downloadUrl: it.downloadUrl,
                  });
                });
              }
            });

            setPurchasedItems(items);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load customer library from local storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleUpdateProgress = (bookId: string, percent: number) => {
    try {
      const progressMap = JSON.parse(localStorage.getItem('anontrove_reading_progress') || '{}');
      progressMap[bookId] = percent;
      localStorage.setItem('anontrove_reading_progress', JSON.stringify(progressMap));
      setPurchasedItems(prev => prev.map(it => it.book.id === bookId ? { ...it, progressPercent: percent } : it));
    } catch {}
  };

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
            streamUrl={activeReadingItem.token 
              ? `/api/download/${activeReadingItem.token}` 
              : `/api/download/verified-pass?book_id=${encodeURIComponent(activeReadingItem.book.id)}`}
            watermarkText={`Licensed to Customer • Order #${activeReadingItem.orderNumber}`}
            allowDownload={true}
            onClose={() => setActiveReadingItem(null)}
          />
        ) : (
          <EpubReader
            title={activeReadingItem.book.title}
            author={activeReadingItem.book.author}
            streamUrl={activeReadingItem.token 
              ? `/api/download/${activeReadingItem.token}` 
              : `/api/download/verified-pass?book_id=${encodeURIComponent(activeReadingItem.book.id)}`}
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
                  {isLoaded && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
                      {purchasedItems.length} {purchasedItems.length === 1 ? 'Title Owned' : 'Titles Owned'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  100% DRM-Free • Instant in-browser reader with personal watermarking and offline study access.
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
                  href="/#catalog-shelf"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                >
                  + Browse Catalog
                </Link>
              </div>
            </div>

            {/* Empty Vault State */}
            {isLoaded && purchasedItems.length === 0 && (
              <div className="mt-12 text-center py-20 bg-[#111724]/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <BookOpen className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Reading Vault is Empty</h2>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Books and documentation you purchase on AnonTrove appear here automatically. All files are DRM-free with immediate reader streaming.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/#catalog-shelf"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Browse Catalog Shelf
                  </Link>
                  <Link
                    href="/orders"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Restore Past Orders
                  </Link>
                </div>
              </div>
            )}

            {/* Grid of Purchased Books */}
            {isLoaded && purchasedItems.length > 0 && (
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
                          src={item.book.coverImage || '/covers/standard-shelf-cover.jpg'}
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

                      {item.token && (
                        <a
                          href={`/api/download/${item.token}`}
                          download
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Download DRM-Free Copy"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}
