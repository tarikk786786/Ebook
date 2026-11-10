'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BookCard from '@/components/BookCard';
import ReaderModal from '@/components/ReaderModal';
import PaymentModal from '@/components/PaymentModal';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import CommandKModal from '@/components/CommandKModal';
import BundlesSection from '@/components/BundlesSection';
import CuratorLetterSection from '@/components/CuratorLetterSection';
import ServiceFeeBreakdown from '@/components/ServiceFeeBreakdown';
import StudentMessageSection from '@/components/StudentMessageSection';
import TransparencyTrustSection from '@/components/TransparencyTrustSection';
import NewsletterSection from '@/components/NewsletterSection';
import FaqSection from '@/components/FaqSection';
import Footer from '@/components/Footer';
import { BOOK_CATALOG, Book, TOTAL_MAPPED_DOCUMENTS } from '@/lib/catalog';
import { AUTHORITATIVE_CATEGORIES } from '@/lib/categories';
import { 
  ShieldCheck, 
  BookOpen, 
  Search, 
  ArrowRight, 
  SlidersHorizontal, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Tablet,
  Laptop,
  Smartphone,
  CheckCircle2,
  Lock,
  Zap,
  Award,
  Heart,
  Flame,
  Archive,
  FileText,
  Code,
  X,
  Languages,
  Briefcase
} from 'lucide-react';

type PriceTier = 'ALL' | '29' | 'UNDER_49' | 'UNDER_99' | 'PREMIUM';
type SortOption = 'POPULAR' | 'CHEAPEST' | 'TITLE';
type CollectionFilter = 'ALL' | 'LATEST_2026' | 'HINDI' | 'BUSINESS' | 'CLASSIC_ARCHIVE' | 'DEALS_29' | 'BOOKS' | 'NOTES' | 'CODE';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCollection, setSelectedCollection] = useState<CollectionFilter>('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('POPULAR');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  
  // Modals & Drawers state
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);
  const [cartOrder, setCartOrder] = useState<any>(null);
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const BOOKS_PER_PAGE = 24;

  // Load wishlist from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('anontrove_wishlist');
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const toggleWishlist = (book: Book) => {
    setWishlist(prev => {
      const exists = prev.some(b => b.id === book.id);
      const next = exists ? prev.filter(b => b.id !== book.id) : [...prev, book];
      try {
        localStorage.setItem('anontrove_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Distinct category list
  const categoryFilters = useMemo(() => {
    return ['All', ...AUTHORITATIVE_CATEGORIES.map(c => c.name)];
  }, []);

  // Filter & Sort
  const filteredBooks = useMemo(() => {
    let result = BOOK_CATALOG.filter((book) => {
      if (book.status === 'DRAFT') return false;

      // Collection & Archive filter
      if (selectedCollection === 'LATEST_2026' && !book.isLatest) return false;
      if (selectedCollection === 'HINDI') {
        const isHindi = book.language === 'hi' || (book.tags && book.tags.includes('hindi')) || (book.category && book.category.toLowerCase().includes('hindi')) || /[\u0900-\u097F]/.test(book.title);
        if (!isHindi) return false;
      }
      if (selectedCollection === 'BUSINESS') {
        const isBiz = (book.category && (book.category.toLowerCase().includes('business') || book.category.toLowerCase().includes('startup') || book.category.toLowerCase().includes('finance') || book.category.toLowerCase().includes('management'))) || (book.tags && book.tags.some(t => ['business', 'startup', 'finance'].includes(t.toLowerCase())));
        if (!isBiz) return false;
      }
      if (selectedCollection === 'CLASSIC_ARCHIVE' && !book.isClassicArchive) return false;
      if (selectedCollection === 'DEALS_29' && book.priceInInr > 29) return false;
      if (selectedCollection === 'BOOKS') {
        const isBook = ['published_ebook', 'textbook', 'professional_book'].includes(book.primaryResourceType || '') || book.isLatest;
        if (!isBook) return false;
      }
      if (selectedCollection === 'NOTES') {
        const isNote = ['study_notes', 'lecture_notes', 'exam_preparation'].includes(book.primaryResourceType || '') || (book.category && book.category.includes('Notes'));
        if (!isNote) return false;
      }
      if (selectedCollection === 'CODE') {
        const isCode = ['code_template', 'template'].includes(book.primaryResourceType || '');
        if (!isCode) return false;
      }

      // Price filter
      if (selectedPriceTier === '29' && book.priceInInr > 29) return false;
      if (selectedPriceTier === 'UNDER_49' && book.priceInInr > 49) return false;
      if (selectedPriceTier === 'UNDER_99' && book.priceInInr > 99) return false;
      if (selectedPriceTier === 'PREMIUM' && book.priceInInr < 100) return false;

      // Category filter
      if (selectedCategory !== 'All') {
        const catDef = AUTHORITATIVE_CATEGORIES.find(c => c.name === selectedCategory);
        if (catDef) {
          const match = catDef.matchedCatalogCategories.some(
            mc => book.category?.toLowerCase() === mc.toLowerCase()
          );
          if (!match && book.category !== selectedCategory) return false;
        } else if (book.category !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = book.title.toLowerCase().includes(q);
        const inAuthor = (book.author || '').toLowerCase().includes(q);
        const inDesc = (book.description || '').toLowerCase().includes(q);
        const inCat = (book.category || '').toLowerCase().includes(q);
        if (!inTitle && !inAuthor && !inDesc && !inCat) return false;
      }

      return true;
    });

    // Sorting: By default (POPULAR), showcase all Bestseller & Demanded books first
    if (sortBy === 'CHEAPEST') {
      result.sort((a, b) => a.priceInInr - b.priceInInr);
    } else if (sortBy === 'TITLE') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // POPULAR: Prioritize Bestsellers, Demanded Guides, and High-Rating Titles
      result.sort((a, b) => {
        if (a.id === 'book-master-bundle') return -1;
        if (b.id === 'book-master-bundle') return 1;

        const aTop = (a.badge === 'Bestseller' || a.badge === 'All-Access Pass' || a.badge === 'Classic' || (a as any).isDemanded || (a.rating || 0) >= 4.9) ? 10 : 0;
        const bTop = (b.badge === 'Bestseller' || b.badge === 'All-Access Pass' || b.badge === 'Classic' || (b as any).isDemanded || (b.rating || 0) >= 4.9) ? 10 : 0;
        if (aTop !== bTop) return bTop - aTop;

        return ((b.reviewCount || 0) * (b.rating || 0)) - ((a.reviewCount || 0) * (a.rating || 0));
      });
    }

    return result;
  }, [selectedCategory, selectedCollection, selectedPriceTier, sortBy, searchQuery]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const currentBooks = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(start, start + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const featuredSpotlight = useMemo(() => {
    return BOOK_CATALOG.filter(b => b.status === 'PUBLISHED' && b.coverImage).slice(0, 4);
  }, []);

  const bestsellerShowcase = useMemo(() => {
    return BOOK_CATALOG.filter(b => 
      b.status === 'PUBLISHED' && 
      (b.badge === 'Bestseller' || b.badge === 'All-Access Pass' || (b as any).isDemanded || (b.rating >= 4.9 && (b.reviewCount || 0) >= 200))
    ).slice(0, 8);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        currency={currency}
        onToggleCurrency={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCommandK={() => setIsCommandKOpen(true)}
      />

      <main className="flex-1">
        {/* Editorial Hero Section with Aceternity/Magic UI background & pill patterns */}
        <section className="relative border-b border-[#E8E4DC] bg-white/90 bg-dot-pattern py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Ambient subtle glow overlay */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9A704B]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Magic UI / Aceternity inspired status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] shadow-sm backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-[#24231F]">
                  {BOOK_CATALOG.length.toLocaleString()} Verified Manuals & Textbooks
                </span>
                <span className="text-[#81796D] hidden xs:inline">•</span>
                <span className="text-[11px] font-semibold text-[#9A704B] hidden xs:inline">Zero DRM</span>
                <span className="text-[#81796D] hidden sm:inline">•</span>
                <button 
                  onClick={() => setIsCommandKOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-[#FAF8F5] hover:bg-[#EFECE4] px-2 py-0.5 rounded-full border border-[#E8E4DC] font-mono text-[#6E685F] transition-all hover:scale-105 active:scale-95"
                  title="Quick Command Search"
                >
                  <Search className="w-2.5 h-2.5 text-[#9A704B]" />
                  <span>Press ⌘K</span>
                </button>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#24231F] leading-[1.12]">
                Universal Digital Library & Independent Bookstore.
              </h1>

              <p className="text-sm sm:text-base text-[#6E685F] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Explore an independent catalog of software engineering handbooks, computer science textbooks, Hindi literature, and business manuals. Universal DRM-free PDF & EPUB delivery starting at ₹29.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href="#catalog-shelf"
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#24231F] hover:bg-[#3D3B35] text-white font-medium text-xs rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Catalog</span>
                </a>

                <a
                  href="#bundles"
                  className="w-full sm:w-auto px-6 py-3.5 border border-[#E8E4DC] hover:border-[#D5CEBE] bg-white hover:bg-[#FAF8F5] text-[#24231F] font-medium text-xs rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Layers className="w-4 h-4 text-[#9A704B]" />
                  <span>Curated Topic Bundles</span>
                </a>

                <button
                  onClick={() => setIsCommandKOpen(true)}
                  className="w-full sm:w-auto px-4 py-3.5 border border-[#E8E4DC] hover:border-[#9A704B]/40 bg-[#FAF8F5] hover:bg-white text-[#6E685F] hover:text-[#24231F] font-medium text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4 text-[#9A704B]" />
                  <span>Quick Search (⌘K)</span>
                </button>
              </div>

              {/* Tremor / Park UI Inspired Key Metric Cards */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3 bg-white/80 border border-[#E8E4DC] rounded-xl shadow-sm">
                  <div className="text-lg font-bold font-serif text-[#24231F]">{BOOK_CATALOG.length.toLocaleString()}+</div>
                  <div className="text-[11px] text-[#81796D] font-sans">Verified Manuals</div>
                </div>
                <div className="p-3 bg-white/80 border border-[#E8E4DC] rounded-xl shadow-sm">
                  <div className="text-lg font-bold font-serif text-[#9A704B]">₹29</div>
                  <div className="text-[11px] text-[#81796D] font-sans">Starting Price</div>
                </div>
                <div className="p-3 bg-white/80 border border-[#E8E4DC] rounded-xl shadow-sm">
                  <div className="text-lg font-bold font-serif text-[#24231F]">100%</div>
                  <div className="text-[11px] text-[#81796D] font-sans">DRM-Free Standard</div>
                </div>
                <div className="p-3 bg-white/80 border border-[#E8E4DC] rounded-xl shadow-sm">
                  <div className="text-lg font-bold font-serif text-[#24231F]">Zero Logs</div>
                  <div className="text-[11px] text-[#81796D] font-sans">In-Browser Reader</div>
                </div>
              </div>
            </div>

            {/* Right: Curated Book Fan Showcase */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center">
                {featuredSpotlight.map((book, idx) => {
                  const offsets = [
                    '-translate-x-12 -rotate-6 z-10',
                    '-translate-x-4 -rotate-2 z-20',
                    'translate-x-4 rotate-2 z-30',
                    'translate-x-12 rotate-6 z-20'
                  ];
                  return (
                    <div
                      key={book.id}
                      className={`absolute w-36 sm:w-44 aspect-[3/4] bg-white border border-[#E8E4DC] rounded-lg overflow-hidden shadow-book-hover transition-transform duration-300 hover:scale-105 ${offsets[idx % 4]}`}
                    >
                      <img
                        src={`/api/covers/${book.slug}?v=3`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Educational Mission & Honest Pricing Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
          <a
            href="#curator-letter"
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF6F1] via-[#FFFDF9] to-[#FAF6F1] border-2 border-[#E8E4DC] hover:border-[#9A704B]/60 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#9A704B]/15 border border-[#9A704B]/30 flex items-center justify-center text-[#9A704B] shrink-0">
                <Heart className="w-5 h-5 fill-[#9A704B] text-[#9A704B]" />
              </div>
              <div>
                <div className="text-sm font-serif font-bold text-[#24231F] flex items-center gap-2">
                  <span>Why is everything priced so affordably (₹9 – ₹29)?</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#9A704B]/10 text-[#9A704B] font-semibold border border-[#9A704B]/20">Our Mission</span>
                </div>
                <p className="text-xs text-[#6E685F] mt-0.5">
                  We charge only a nominal ₹9 to ₹29 maintenance &amp; storage fee to democratize education for every student and self-taught engineer.
                </p>
              </div>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center gap-1.5 text-xs font-semibold text-[#9A704B] group-hover:translate-x-1 transition-transform">
              <span>Read Curator&apos;s Open Letter</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>
        </div>

        {/* 10 Topical Category Pillars */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase font-sans font-semibold tracking-wider text-[#9A704B]">
              Topical Classification
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
              Explore by Core Discipline
            </h2>
            <p className="text-xs sm:text-sm text-[#6E685F]">
              Browse 10 authoritative categories structured for software engineers, traders, and students.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {AUTHORITATIVE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group bg-white border border-[#E8E4DC] hover:border-[#D5CEBE] p-4 rounded-xl shadow-book hover:shadow-book-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-sans font-semibold uppercase text-[#9A704B]">
                    {cat.badge}
                  </span>
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-[#24231F] group-hover:text-[#9A704B] transition-colors mt-1 line-clamp-2">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#81796D] mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E8E4DC] flex items-center justify-between text-[10px] font-sans font-medium text-[#81796D]">
                  <span>Explore Shelf</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-[#9A704B]" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Curated Ebook Bundles */}
        <BundlesSection 
          onSelectBuy={(b) => setBuyingBook(b)} 
          currency={currency} 
        />

        {/* Real-time Trending & Rising Demand Discovery Showcase */}
        <section id="trending" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E8E4DC] bg-white/60 rounded-2xl my-8 scroll-mt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Automated Discovery Engine • Multi-Provider Verified
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
                Trending eBooks & Rising Stars
              </h2>
              <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
                Titles with rapidly surging reader engagement, high search interest, and top global rankings.
              </p>
            </div>
            <Link
              href="/admin/discovery"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#9A704B] hover:text-[#7A583B] transition-colors"
            >
              <span>Explore Discovery Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {bestsellerShowcase.slice(0, 4).concat(bestsellerShowcase.slice(4, 8)).map((book, idx) => (
              <BookCard
                key={`trending-${book.id}-${idx}`}
                book={{
                  ...book,
                  badge: book.badge || (idx % 2 === 0 ? 'Trending' : 'Rising Star')
                }}
                currency={currency}
                onSelectBuy={(b) => setBuyingBook(b)}
                onSelectPreview={(b) => setPreviewBook(b)}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.some(w => w.id === book.id)}
              />
            ))}
          </div>
        </section>

        {/* Dedicated Bestsellers & Demanded Masterclasses Showcase */}
        <section id="bestsellers" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E8E4DC] scroll-mt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5 text-[#9A704B]" />
                Curated Academic & Professional Literature • Instant PDF Delivery
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
                Bestsellers & Most Demanded Titles
              </h2>
              <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
                The most requested software engineering playbooks, security guides, and startup manuals.
              </p>
            </div>
            <a
              href="#catalog-shelf"
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#9A704B] hover:text-[#7A583B] transition-colors"
            >
              <span>View All Titles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {bestsellerShowcase.map((book) => (
              <BookCard
                key={`bestseller-${book.id}`}
                book={book}
                currency={currency}
                onSelectBuy={(b) => setBuyingBook(b)}
                onSelectPreview={(b) => setPreviewBook(b)}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.some(w => w.id === book.id)}
              />
            ))}
          </div>
        </section>

        {/* Main Catalog Shelf */}
        <section id="catalog-shelf" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E8E4DC] scroll-mt-16">
          <div id="catalog" className="absolute -top-16" />
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] text-[11px] font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-[#9A704B]" />
                Curated Digital Study Guides & Reference Editions
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
                The AnonTrove Catalog Shelf
              </h2>
                            <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
                Curated study guides, technical manuals, and reference materials across our digital collection.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="/AnonTrove_Complete_86k_Ebooks_Directory.pdf"
                  download="AnonTrove_Complete_86k_Ebooks_Directory.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors shadow-sm"
                  title="Download complete 86,260 ebook catalog directory in PDF format"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📥 Download 86k PDF Directory (786 Pages)</span>
                </a>
                <a
                  href="/all_ebooks_catalog.csv"
                  download="all_ebooks_catalog.csv"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EDE6] text-[#24231F] border border-[#E8E4DC] text-xs font-medium transition-colors"
                >
                  <span>📊 86k CSV Directory</span>
                </a>
              </div>
            </div>

            {/* Quick Sorting Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#81796D]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E8E4DC] rounded-md px-3 py-1.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
              >
                <option value="POPULAR">Most Popular</option>
                <option value="CHEAPEST">Price: Lowest First</option>
                <option value="TITLE">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filtering Control Bar */}
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-4 sm:p-5 mb-8 shadow-book space-y-4 max-w-full overflow-hidden">
            {/* Collection & Archive Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#81796D] uppercase tracking-wider">Collections & Archives:</span>
                <span className="text-[11px] text-[#9A704B] font-medium hidden sm:inline">
                  {selectedCollection === 'ALL' ? 'Complete Library Collection' : selectedCollection === 'LATEST_2026' ? '1,000 Curated 2026 Masterclasses' : selectedCollection === 'HINDI' ? '2,065+ Hindi Literature & Regional Titles' : selectedCollection === 'BUSINESS' ? '6,181+ Business & Non-Fiction Books' : selectedCollection === 'CLASSIC_ARCHIVE' ? '12k+ Classic Archive' : selectedCollection === 'DEALS_29' ? '₹29 Steal Deals' : 'Filtered Collection'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => { setSelectedCollection('ALL'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'ALL'
                      ? 'bg-[#24231F] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                  }`}
                >
                  <span>🌟 All Titles ({TOTAL_MAPPED_DOCUMENTS.toLocaleString()}+)</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('LATEST_2026'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'LATEST_2026'
                      ? 'bg-[#9A704B] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#9A704B]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>🚀 Latest 2026 Books (1,000)</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('HINDI'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'HINDI'
                      ? 'bg-[#E05A47] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#E05A47]'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5 text-orange-400" />
                  <span>🇮🇳 Hindi Books (2,065+)</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('BUSINESS'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'BUSINESS'
                      ? 'bg-[#1E3A8A] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#1E3A8A]'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                  <span>💼 Business & Non-Fiction (6,180+)</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('CLASSIC_ARCHIVE'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'CLASSIC_ARCHIVE'
                      ? 'bg-[#2B4162] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#2B4162]'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-blue-400" />
                  <span>🏛️ Classic 12k+ Digital Archive</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('DEALS_29'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'DEALS_29'
                      ? 'bg-rose-700 text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-rose-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>🔥 ₹29 Steal Deals</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('BOOKS'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'BOOKS'
                      ? 'bg-[#24231F] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>📚 Published Books</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('NOTES'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'NOTES'
                      ? 'bg-[#24231F] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>📝 Study & Exam Notes</span>
                </button>
                <button
                  onClick={() => { setSelectedCollection('CODE'); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedCollection === 'CODE'
                      ? 'bg-[#24231F] text-white shadow-sm font-semibold'
                      : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 text-cyan-500" />
                  <span>💻 Code & Dev Assets</span>
                </button>
              </div>
            </div>

            {/* Discipline Filter Tabs */}
            <div className="space-y-1.5 pt-3 border-t border-[#E8E4DC]">
              <span className="text-xs font-semibold text-[#81796D] uppercase tracking-wider block">Discipline & Topic:</span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#24231F] text-white shadow-sm'
                        : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Cap & Active Filter Reset */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#E8E4DC] gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#81796D] font-medium">Price Cap:</span>
                <button
                  onClick={() => { setSelectedPriceTier('ALL'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedPriceTier === 'ALL' ? 'bg-[#FAF6F1] text-[#9A704B] font-semibold border border-[#F2E8DC]' : 'text-[#6E685F] hover:text-[#24231F]'}`}
                >
                  All Prices
                </button>
                <button
                  onClick={() => { setSelectedPriceTier('29'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedPriceTier === '29' ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200' : 'text-[#6E685F] hover:text-[#24231F]'}`}
                >
                  🔥 ₹29 Deals
                </button>
                <button
                  onClick={() => { setSelectedPriceTier('UNDER_49'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedPriceTier === 'UNDER_49' ? 'bg-[#FAF6F1] text-[#9A704B] font-semibold border border-[#F2E8DC]' : 'text-[#6E685F] hover:text-[#24231F]'}`}
                >
                  ⚡ Under ₹49
                </button>
                <button
                  onClick={() => { setSelectedPriceTier('UNDER_99'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedPriceTier === 'UNDER_99' ? 'bg-[#FAF6F1] text-[#9A704B] font-semibold border border-[#F2E8DC]' : 'text-[#6E685F] hover:text-[#24231F]'}`}
                >
                  💎 Under ₹99
                </button>
                <button
                  onClick={() => { setSelectedPriceTier('PREMIUM'); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${selectedPriceTier === 'PREMIUM' ? 'bg-[#FAF6F1] text-[#9A704B] font-semibold border border-[#F2E8DC]' : 'text-[#6E685F] hover:text-[#24231F]'}`}
                >
                  🚀 ₹100+ Full Volumes
                </button>
              </div>

              {(selectedCategory !== 'All' || selectedCollection !== 'ALL' || selectedPriceTier !== 'ALL' || searchQuery) && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#81796D] hidden md:inline">Filters active</span>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedCollection('ALL');
                      setSelectedPriceTier('ALL');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                  className="flex items-center gap-1 text-[#9A704B] hover:text-[#24231F] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
                </div>
              )}
            </div>
          </div>

          {/* High-Converting Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-xs font-sans">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-[#24231F]">
              <Zap className="w-4 h-4 text-[#9A704B] shrink-0" />
              <div>
                <p className="font-semibold text-[11px] leading-tight">Instant UPI Delivery</p>
                <p className="text-[10px] text-[#81796D] leading-tight mt-0.5">Automated 0% fee checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-[#24231F]">
              <BookOpen className="w-4 h-4 text-[#9A704B] shrink-0" />
              <div>
                <p className="font-semibold text-[11px] leading-tight">Universal DRM-Free</p>
                <p className="text-[10px] text-[#81796D] leading-tight mt-0.5">PDF for Kindle, iPad & Mac</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-[#24231F]">
              <ShieldCheck className="w-4 h-4 text-[#9A704B] shrink-0" />
              <div>
                <p className="font-semibold text-[11px] leading-tight">100% Real Cover Scans</p>
                <p className="text-[10px] text-[#81796D] leading-tight mt-0.5">Verified publisher editions</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-[#24231F]">
              <Lock className="w-4 h-4 text-[#9A704B] shrink-0" />
              <div>
                <p className="font-semibold text-[11px] leading-tight">Zero-Trace Privacy</p>
                <p className="text-[10px] text-[#81796D] leading-tight mt-0.5">No accounts or tracking</p>
              </div>
            </div>
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                currency={currency}
                onSelectBuy={(b) => setBuyingBook(b)}
                onSelectPreview={(b) => setPreviewBook(b)}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.some(w => w.id === book.id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 pt-6 border-t border-[#E8E4DC] flex items-center justify-between text-xs text-[#6E685F]">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: document.getElementById('catalog-shelf')?.offsetTop || document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-lg border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="font-mono text-xs text-[#24231F]">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: document.getElementById('catalog-shelf')?.offsetTop || document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-lg border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Brand Values & Publishing Standards */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E8E4DC]">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs uppercase font-sans font-semibold tracking-wider text-[#9A704B]">
              The AnonTrove Standard
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
              Why Engineers & Students Choose AnonTrove
            </h2>
            <p className="text-xs sm:text-sm text-[#6E685F]">
              High-signal educational literature without bloated software subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2.5 shadow-book">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">DRM-Free Universal PDF</h3>
              <p className="text-xs text-[#6E685F] leading-relaxed">
                Permanent ownership of your files. Read on Kindle, iPad, Remarkable tablet, or desktop laptop with zero restrictions.
              </p>
            </div>

            <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2.5 shadow-book">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">Zero-Install Reader</h3>
              <p className="text-xs text-[#6E685F] leading-relaxed">
                Read immediately in your browser upon purchase. Clean responsive pagination, dark/sepia paper modes, and instant search.
              </p>
            </div>

            <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2.5 shadow-book">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">Direct UPI Checkout</h3>
              <p className="text-xs text-[#6E685F] leading-relaxed">
                Instant delivery using Google Pay, PhonePe, Paytm, FamPay, or BHIM with zero processing surcharges.
              </p>
            </div>

            <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2.5 shadow-book">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">100% Satisfaction Guarantee</h3>
              <p className="text-xs text-[#6E685F] leading-relaxed">
                Complete money-back guarantee if an edition does not match its catalog description or encounters reading defects.
              </p>
            </div>
          </div>
        </section>

        {/* Transparent Curator Open Letter: Why We Sell So Cheap & Education Mission */}
        <div id="curator-letter" className="scroll-mt-16">
          <CuratorLetterSection />
        </div>

        {/* Cost Breakdown & Where Contributions Go */}
        <ServiceFeeBreakdown />

        {/* Dedication To Every Student & Independent Learner */}
        <StudentMessageSection />

        {/* 8 Transparency Commitments & Honest Standards */}
        <TransparencyTrustSection />

        {/* Newsletter & Free Primer Funnel */}
        <NewsletterSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      <Footer />

      {/* Modals & Drawers */}
      {buyingBook && (
        <PaymentModal
          book={buyingBook}
          onClose={() => setBuyingBook(null)}
        />
      )}

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

      {cartOrder && (
        <PaymentModal
          initialOrder={cartOrder}
          onClose={() => setCartOrder(null)}
        />
      )}

      <CartDrawer 
        onStartCheckout={(orderData) => setCartOrder(orderData)} 
      />

      <CommandKModal
        isOpen={isCommandKOpen}
        onClose={() => setIsCommandKOpen(false)}
        books={BOOK_CATALOG}
        onSelectBook={(b) => setBuyingBook(b)}
        onPreviewBook={(b) => setPreviewBook(b)}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={(id) => {
          setWishlist(prev => {
            const next = prev.filter(b => b.id !== id);
            try { localStorage.setItem('anontrove_wishlist', JSON.stringify(next)); } catch {}
            return next;
          });
        }}
      />
    </div>
  );
}
