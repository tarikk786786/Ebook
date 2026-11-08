'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Grid,
  List,
  Sparkles,
  ShieldCheck,
  Globe,
  Database
} from 'lucide-react';
import type { DiscoveryBook, DiscoveryCategory } from '@/lib/discovery/types';

export default function GlobalDiscoveryPage() {
  const [books, setBooks] = useState<DiscoveryBook[]>([]);
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('REF_ASC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/discovery/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        sort: sortBy,
        page: page.toString(),
        pageSize: '32',
      });
      const res = await fetch(`/api/discovery/books?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
        setTotalPages(data.totalPages);
        setTotalCount(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, page]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Hero Banner */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-16 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>Curated Worldwide Bibliography — 1,000 Distinct Titles</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
            Global Startup & Business <span className="text-emerald-400">Book Discovery</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive, verified reading directory for founders, entrepreneurs, operators, marketers, and investors spanning 25 core business domains.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-2">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search 1,000 titles by name, author, ISBN, or topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/70">
          {/* Category Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => { setSelectedCategory('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Domains (1,000)
            </button>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Secondary Filters & Sort */}
          <div className="flex items-center gap-3 justify-end flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Select All 25 Domains...</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name} ({c.count})</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="REF_ASC">Index #0001–1000</option>
              <option value="TITLE_ASC">Title A–Z</option>
              <option value="YEAR_DESC">Publication Year (Newest)</option>
              <option value="RATING_DESC">Highest Rated</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing <strong className="text-white">{books.length}</strong> of <strong className="text-white">{totalCount}</strong> curated business books</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Querying bibliographic registry...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No books match your criteria</h3>
            <p className="text-xs text-slate-400">Try adjusting your search terms or clearing selected category filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedStatus('ALL'); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-xl text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* High-Density Editorial Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((book) => (
              <div
                key={book.ref}
                className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-emerald-500/5"
              >
                <div className="space-y-3">
                  {/* Top Meta: Ref Number & Category */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      #{book.ref}
                    </span>
                    <span className="text-slate-400 truncate max-w-[160px]" title={book.category}>
                      {book.category}
                    </span>
                  </div>

                  {/* Cover Artwork or Typographic Fallback */}
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-center p-4">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="space-y-2 p-2">
                        <BookOpen className="w-8 h-8 text-emerald-500/60 mx-auto" />
                        <p className="text-xs font-bold text-white line-clamp-3 leading-snug">{book.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{book.author}</p>
                      </div>
                    )}

                    {/* Verification Badge */}
                    <div className="absolute top-2 right-2">
                      {book.verificationStatus === 'VERIFIED' ? (
                        <span className="flex items-center gap-1 bg-emerald-950/90 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-800 shadow">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-slate-950/90 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-800 shadow">
                          Seed #1000
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">
                      by {book.author}
                    </p>
                  </div>
                </div>

                {/* Footer Details Link */}
                <div className="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {book.publishedYear ? `Pub: ${book.publishedYear}` : 'Biblio Ref'}
                  </span>
                  <Link
                    href={`/books/${book.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Detailed Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="p-4">Ref</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Author(s)</th>
                  <th className="p-4">Domain Category</th>
                  <th className="p-4">ISBN</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {books.map((book) => (
                  <tr key={book.ref} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4 font-mono font-semibold text-emerald-400">#{book.ref}</td>
                    <td className="p-4 font-bold text-white max-w-xs truncate">{book.title}</td>
                    <td className="p-4 text-slate-300 truncate max-w-[180px]">{book.author}</td>
                    <td className="p-4 text-slate-400">{book.category}</td>
                    <td className="p-4 font-mono text-slate-500">{book.isbn13 || book.isbn10 || '—'}</td>
                    <td className="p-4">
                      {book.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Discovered</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/books/${book.slug}`}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400 px-3">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
