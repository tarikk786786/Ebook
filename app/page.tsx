'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import BookTable from '@/components/BookTable';
import ReaderModal from '@/components/ReaderModal';
import PaymentModal from '@/components/PaymentModal';
import CartDrawer from '@/components/CartDrawer';
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
  Tag,
  SlidersHorizontal,
  TrendingDown,
  Flame,
  Check,
  Eye,
  Layers,
  LayoutGrid,
  List,
  X,
  RotateCcw
} from 'lucide-react';

type PriceTier = 'ALL' | '29' | 'UNDER_49' | 'UNDER_99' | 'PREMIUM';
type SortOption = 'CHEAPEST' | 'POPULAR' | 'RATING' | 'TITLE';
type ResourceTypeFilter = 'ALL' | 'BOOKS' | 'course_material' | 'technical_manual' | 'template' | 'NOTES' | 'exam_preparation' | 'research_paper';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceTypeFilter>('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('CHEAPEST');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);
  const [cartOrder, setCartOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const BOOKS_PER_PAGE = 24;

  // Categories list
  const categories = useMemo(() => {
    const publishedBooks = BOOK_CATALOG.filter((b) => b.status !== 'DRAFT');
    const rawCats = Array.from(new Set(publishedBooks.map((b) => b.category))).filter(Boolean);
    const otherCats = rawCats.filter((c) => c !== 'Zebra Learn Collection');
    return ['All', 'Zebra Learn Collection', ...otherCats];
  }, []);

  // Filter & Sort
  const filteredBooks = useMemo(() => {
    let result = BOOK_CATALOG.filter((book) => {
      if (book.status === 'DRAFT') return false;
      if (book.id === 'book-master-bundle') return false;

      // Price filter
      if (selectedPriceTier === '29' && book.priceInInr > 29) return false;
      if (selectedPriceTier === 'UNDER_49' && book.priceInInr > 49) return false;
      if (selectedPriceTier === 'UNDER_99' && book.priceInInr > 99) return false;
      if (selectedPriceTier === 'PREMIUM' && book.priceInInr < 100) return false;

      // Resource Type filter
      if (selectedResourceType !== 'ALL') {
        const bType = book.primaryResourceType || 'course_material';
        if (selectedResourceType === 'BOOKS') {
          if (!['published_ebook', 'textbook', 'professional_book'].includes(bType)) return false;
        } else if (selectedResourceType === 'NOTES') {
          if (!['lecture_notes', 'study_notes'].includes(bType)) return false;
        } else if (bType !== selectedResourceType) {
          return false;
        }
      }

      // Category filter
      const isZebraMatch = 
        book.category === 'Zebra Learn Collection' ||
        (book.tags && book.tags.includes('Zebra Learn')) ||
        book.publisher === 'Zebra Learn' ||
        (book.title + ' ' + book.author + ' ' + (book.badge || '')).toLowerCase().includes('zebra');

      let matchesCategory = false;
      if (selectedCategory === 'All') {
        matchesCategory = true;
      } else if (selectedCategory === 'Zebra Learn Collection') {
        matchesCategory = isZebraMatch;
      } else {
        matchesCategory = book.category === selectedCategory;
      }

      if (!matchesCategory) return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches = 
          book.title.toLowerCase().includes(q) ||
          book.subtitle.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.description.toLowerCase().includes(q) ||
          (book.sourceTelegram && book.sourceTelegram.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'CHEAPEST') return a.priceInInr - b.priceInInr;
      if (sortBy === 'POPULAR') return (b.reviewCount || 0) - (a.reviewCount || 0);
      if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [selectedCategory, selectedResourceType, selectedPriceTier, sortBy, searchQuery]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedResourceType, selectedPriceTier, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const currentBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const handlePageChange = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(target);
    const shelfEl = document.getElementById('catalog-shelf');
    if (shelfEl) {
      shelfEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceTier('ALL');
    setSelectedResourceType('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    selectedCategory !== 'All' || 
    selectedPriceTier !== 'ALL' || 
    selectedResourceType !== 'ALL' || 
    searchQuery.trim() !== '';

  // Master Bundle Object
  const masterBundleBook: Book = BOOK_CATALOG.find(b => b.id === 'book-master-bundle') || BOOK_CATALOG[0];

  // Hand-picked spotlight steal deals
  const spotlightDeals: Book[] = useMemo(() => {
    const targetIds = [
      'book-101-linux-commands',
      'book-10-trading-strategies-by-aseem-singhal',
      'book-basics-of-equity-research-by-zebra-learn',
      'book-010-cyber-security-notes-cybersecurity-day-2p'
    ];
    return targetIds
      .map(id => BOOK_CATALOG.find(b => b.id === id))
      .filter((b): b is Book => Boolean(b));
  }, []);

  const searchTags = [
    'Linux Commands',
    'Trading Strategies',
    'Zebra Learn',
    'Cybersecurity',
    'Python',
    'AutoCAD',
    'Exam Prep Notes',
    'Stock Market'
  ];

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
      />

      <main className="flex-1 bg-[#090D14]">
        {/* Universal Bookstore Hero */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-800/80">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider">Independent Digital Ebook Commerce</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300 font-semibold">1,668+ Verified Digital Titles Starting at ₹29</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Independent Digital Ebook Store.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Uncompromising Quality.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Discover and own <strong className="text-white">1,668 verified digital books and guides</strong> across Software Engineering, Stock Trading, Cybersecurity, AI & Machine Learning, Zebra Learn, and Exam Prep. Instant Multi-Item Cart, Razorpay & UPI checkout, and in-browser reading.
            </p>

            {/* Quick Value Pillars */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>1,350+ @ ₹29</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Unmatched micro-pricing for students & builders.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>Razorpay + Cashfree</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Cards, UPI QR & NetBanking with 0s delivery.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>100% DRM-Free</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Genuine PDF & EPUB files you own forever.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                  <Tablet className="w-4 h-4 text-cyan-400" />
                  <span>In-Browser Reader</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Read anywhere with saved cross-device progress.
                </div>
              </div>
            </div>

            {/* Quick Search Tag Chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold mr-1">Popular topics:</span>
              {searchTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900 font-semibold flex items-center space-x-1"
                >
                  <span>Clear</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Spotlight Steal Deals of the Day (4 Bestsellers under ₹99) */}
        {spotlightDeals.length > 0 && searchQuery === '' && selectedCategory === 'All' && selectedPriceTier === 'ALL' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Today's Essential Steal Deals</h2>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono font-bold text-amber-300 uppercase">
                    Up to 90% Off
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Hand-picked community favorites at micro-pricing. Instant download upon scan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {spotlightDeals.map((book) => (
                <div 
                  key={book.id}
                  className="bg-[#111724] border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  <div>
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 shadow-md mb-3">
                      <img 
                        src={book.coverImage} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded shadow">
                        ₹{book.priceInInr} ONLY
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{book.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">By {book.author}</p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5">
                      <span>{book.pages} Pages</span>
                      <span>•</span>
                      <span>{book.format}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-lg font-black text-emerald-400 font-mono">₹{book.priceInInr}</div>
                      <div className="text-[10px] text-slate-500 line-through">₹{book.originalPriceInInr}</div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPreviewBook(book)}
                        className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs"
                        title="Look Inside"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setBuyingBook(book)}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Get ₹{book.priceInInr}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Master Bundle Special Offer Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-[#111724] via-[#141E30] to-[#111724] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-md shadow-sm">
                  Limited Boxset Deal
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
                  <span>Instant Razorpay & UPI Download</span>
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
              <div className="text-[11px] text-emerald-400 font-medium mb-3">Multi-Gateway • Instant Settlement</div>

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

        {/* Main Catalog Shelf Section */}
        <section id="catalog-shelf" className="py-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Controls Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Browse Ebook Catalog</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-400">
                    {filteredBooks.length.toLocaleString()} Titles Available
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Showing {filteredBooks.length > 0 ? (currentPage - 1) * BOOKS_PER_PAGE + 1 : 0}–{Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length)} of {filteredBooks.length.toLocaleString()} verified texts
                </p>
              </div>

              {/* Price Tier Selector, Sort Option & View Mode */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Price Presets */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setSelectedPriceTier('ALL')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      selectedPriceTier === 'ALL'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Prices
                  </button>
                  <button
                    onClick={() => setSelectedPriceTier('29')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      selectedPriceTier === '29'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔥 ₹29 Deals
                  </button>
                  <button
                    onClick={() => setSelectedPriceTier('UNDER_49')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      selectedPriceTier === 'UNDER_49'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Under ₹49
                  </button>
                  <button
                    onClick={() => setSelectedPriceTier('UNDER_99')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      selectedPriceTier === 'UNDER_99'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💎 Under ₹99
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="CHEAPEST">Price: Low to High (Cheapest)</option>
                  <option value="POPULAR">Most Popular</option>
                  <option value="RATING">Highest Rated</option>
                  <option value="TITLE">Title A–Z</option>
                </select>

                {/* View Switcher: Grid vs Table */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="3D Book Jackets View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'table'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Power Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips with 1-Click Reset */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 pb-1 border-t border-slate-800/60">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Active filters:</span>
                
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs">
                    <span>Category: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('All')} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPriceTier !== 'ALL' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs">
                    <span>Price: {selectedPriceTier === '29' ? '₹29 Only' : selectedPriceTier === 'UNDER_49' ? 'Under ₹49' : 'Under ₹99'}</span>
                    <button onClick={() => setSelectedPriceTier('ALL')} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedResourceType !== 'ALL' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 text-xs">
                    <span>Type: {selectedResourceType}</span>
                    <button onClick={() => setSelectedResourceType('ALL')} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() !== '' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs">
                    <span>Search: "{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 ml-auto font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            )}

            {/* Resource Type Multi-Format Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold mr-1 shrink-0">Resource Type:</span>
              <button
                onClick={() => setSelectedResourceType('ALL')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'ALL'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setSelectedResourceType('BOOKS')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'BOOKS'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                📚 Published Books
              </button>
              <button
                onClick={() => setSelectedResourceType('course_material')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'course_material'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🎓 Course Materials
              </button>
              <button
                onClick={() => setSelectedResourceType('technical_manual')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'technical_manual'
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Technical Manuals
              </button>
              <button
                onClick={() => setSelectedResourceType('template')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'template'
                    ? 'bg-pink-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                📋 Templates & Checklists
              </button>
              <button
                onClick={() => setSelectedResourceType('NOTES')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'NOTES'
                    ? 'bg-orange-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                📝 Lecture & Study Notes
              </button>
              <button
                onClick={() => setSelectedResourceType('exam_preparation')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'exam_preparation'
                    ? 'bg-rose-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🎯 Exam Preparation
              </button>
              <button
                onClick={() => setSelectedResourceType('research_paper')}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedResourceType === 'research_paper'
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🔬 Research Papers
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-thin max-w-full">
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

          {/* Book Catalog: Either 3D Jacket Grid or Power Table */}
          {currentBooks.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentBooks.map((book) => (
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
                <BookTable
                  books={currentBooks}
                  currency={currency}
                  onSelectBuy={(b) => setBuyingBook(b)}
                  onSelectPreview={(b) => setPreviewBook(b)}
                />
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
                  <p className="text-xs text-slate-400 font-mono">
                    Page <span className="text-white font-bold">{currentPage}</span> of{' '}
                    <span className="text-white font-bold">{totalPages}</span> ({filteredBooks.length.toLocaleString()} total eBooks)
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ◀ Previous
                    </button>

                    {/* Page quick jumps */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                        let pageNum = currentPage;
                        if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }
                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                              currentPage === pageNum
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-8">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No eBooks match your filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try clearing search terms or selecting "All Prices" to explore the full collection of 1,668+ titles.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* Universal Guarantee & FAQ */}
        <FaqSection />
      </main>

      {/* Slide-Over Multi-Item Shopping Cart Drawer */}
      <CartDrawer 
        onStartCheckout={(orderData, gateway) => {
          // Launch payment session modal with dynamic UPI QR & direct redirect option
          setCartOrder(orderData);
        }} 
      />

      {/* Reader Modal (Look Inside) */}
      {previewBook && (
        <ReaderModal
          book={previewBook}
          onClose={() => setPreviewBook(null)}
          onBuy={(b) => {
            setPreviewBook(null);
            setBuyingBook(b);
          }}
        />
      )}

      {/* Dynamic UPI QR & Redirect Payment Modal */}
      {(buyingBook || cartOrder) && (
        <PaymentModal
          book={buyingBook}
          initialOrder={cartOrder}
          onClose={() => {
            setBuyingBook(null);
            setCartOrder(null);
          }}
        />
      )}
    </>
  );
}
