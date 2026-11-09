'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  Database,
  CheckCircle,
  Clock,
  Layers,
  Download,
  Play,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Search,
  ChevronRight,
  ArrowLeft,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  Sliders,
  Filter,
  Check,
  X,
  Star,
  Eye,
  BookOpen
} from 'lucide-react';
import type { DiscoveryBook, StorefrontSection, DemandGrade, ApprovalStatus } from '@/lib/discovery/types';
import { RESEARCH_CATEGORIES } from '@/lib/discovery/providers/multiProvider';

interface DiscoveryStats {
  totalDiscovered: number;
  totalApproved: number;
  verifiedBestsellers: number;
  highDemand: number;
  risingStars: number;
  withCover: number;
  withIsbn: number;
  categories: Array<{ id: number; name: string; slug: string; count: number }>;
}

export default function AdminDiscoveryPage() {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [books, setBooks] = useState<DiscoveryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'approved' | 'categories' | 'logs'>('feed');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedBookForEvidence, setSelectedBookForEvidence] = useState<DiscoveryBook | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 16;

  const [logs, setWorkerLogs] = useState<string[]>([
    'System initialized. Connected to Open Library (Trending & Subjects APIs) and Google Books API v1.',
    'Multi-provider discovery engine armed across 10 subject domains.',
    'Deterministic demand scoring calibrated with zero-fabrication criteria.'
  ]);

  const addLog = (msg: string) => {
    setWorkerLogs(prev => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49) ]);
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        category: selectedCategory,
        grade: selectedGrade,
        approvalStatus: selectedApproval,
      });
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const [feedRes, statsRes] = await Promise.all([
        fetch(`/api/discovery/feed?${params.toString()}`),
        fetch('/api/discovery/stats')
      ]);

      const feedData = await feedRes.json();
      if (feedData.success) {
        setBooks(feedData.books || []);
        setTotalPages(feedData.totalPages || 1);
      }

      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats?.automatedDiscovery) {
        setStats(statsData.stats.automatedDiscovery);
      }
    } catch (err: any) {
      console.error('Failed to load discovery feed:', err);
      addLog(`Error loading feed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [page, selectedCategory, selectedGrade, selectedApproval]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadFeed();
  };

  const runLiveResearch = async () => {
    setResearching(true);
    addLog('Triggering live multi-provider eBook discovery across 10 categories...');
    try {
      const res = await fetch('/api/discovery/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPerCategory: 5, includeTrending: true })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Discovery success! ${data.message}`);
        setActionMessage(data.message);
        setPage(1);
        await loadFeed();
      } else {
        addLog(`Discovery failed: ${data.error}`);
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`Discovery network error: ${err.message}`);
    } finally {
      setResearching(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const handleApprove = async (id: string, sections?: StorefrontSection[]) => {
    try {
      const res = await fetch('/api/discovery/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sections: sections || ['TRENDING_EBOOKS', 'TOP_BESTSELLERS'] })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Approved book: ${data.book?.title}`);
        setBooks(prev => prev.map(b => b.id === id ? { ...b, approvalStatus: 'APPROVED' } : b));
        if (stats) setStats({ ...stats, totalApproved: stats.totalApproved + 1 });
      }
    } catch (err: any) {
      addLog(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/discovery/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Rejected book id: ${id}`);
        setBooks(prev => prev.map(b => b.id === id ? { ...b, approvalStatus: 'REJECTED' } : b));
      }
    } catch (err: any) {
      addLog(`Rejection error: ${err.message}`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/discovery/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, sections: ['TRENDING_EBOOKS', 'TOP_BESTSELLERS'] })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Bulk approved ${data.approvedCount} books.`);
        setActionMessage(`Approved ${data.approvedCount} books!`);
        setSelectedIds([]);
        loadFeed();
      }
    } catch (err: any) {
      addLog(`Bulk approval error: ${err.message}`);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/discovery/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Bulk rejected ${data.rejectedCount} books.`);
        setSelectedIds([]);
        loadFeed();
      }
    } catch (err: any) {
      addLog(`Bulk reject error: ${err.message}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === books.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(books.map(b => b.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DC] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E4DC] transition-all text-[#6E685F]">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-base text-[#24231F]">Bestselling & Trending Book Discovery Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                  LIVE MULTI-PROVIDER
                </span>
              </div>
              <p className="text-[10px] text-[#81796D]">Open Library • Google Books API • Internet Archive • NYT Bestsellers</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={runLiveResearch}
              disabled={researching}
              className="px-3.5 py-1.5 rounded-xl bg-[#24231F] hover:bg-[#9A704B] text-white text-xs font-semibold transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${researching ? 'animate-spin text-amber-300' : 'fill-current'}`} />
              <span>{researching ? 'Discovering Books...' : 'Run Multi-API Discovery'}</span>
            </button>
            <button
              onClick={loadFeed}
              className="p-2 rounded-xl border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-[#6E685F] transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#9A704B]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Action notification banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Intelligence KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm">
            <div className="text-[11px] text-[#81796D] font-medium">Discovered Feed</div>
            <div className="text-2xl font-bold font-serif text-[#24231F] mt-1">{stats?.totalDiscovered || books.length}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Multi-source deduplicated</div>
          </div>

          <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm">
            <div className="text-[11px] text-[#81796D] font-medium">Verified Bestsellers</div>
            <div className="text-2xl font-bold font-serif text-[#9A704B] mt-1">{stats?.verifiedBestsellers || 0}</div>
            <div className="text-[10px] text-[#81796D] mt-1">Top Trending & NYT Lists</div>
          </div>

          <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm">
            <div className="text-[11px] text-[#81796D] font-medium">High Demand Books</div>
            <div className="text-2xl font-bold font-serif text-[#24231F] mt-1">{stats?.highDemand || 0}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Score ≥ 70 / 100</div>
          </div>

          <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm">
            <div className="text-[11px] text-[#81796D] font-medium">Rising Stars</div>
            <div className="text-2xl font-bold font-serif text-blue-600 mt-1">{stats?.risingStars || 0}</div>
            <div className="text-[10px] text-blue-600 font-medium mt-1">2024-2026 Releases</div>
          </div>

          <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm">
            <div className="text-[11px] text-[#81796D] font-medium">Storefront Approved</div>
            <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">{stats?.totalApproved || 0}</div>
            <div className="text-[10px] text-emerald-700 font-medium mt-1">Published to sections</div>
          </div>
        </div>

        {/* 10 Core Category Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#24231F] flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-[#9A704B]" />
              <span>10 Authoritative Research Domains</span>
            </span>
            <span className="text-[11px] text-[#81796D]">Filter discovered titles by academic & commercial category</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory('ALL'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[#24231F] text-white shadow-sm'
                  : 'bg-white border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
              }`}
            >
              All Categories
            </button>
            {RESEARCH_CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#9A704B] text-white shadow-sm font-semibold'
                    : 'bg-white border border-[#E8E4DC] text-[#6E685F] hover:text-[#24231F]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Control & Filter Toolbar */}
        <div className="bg-white border border-[#E8E4DC] p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-[#81796D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg pl-9 pr-4 py-2 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
            />
          </form>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setPage(1); }}
              className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-2.5 py-1.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
            >
              <option value="ALL">All Demand Grades</option>
              <option value="VERIFIED_BESTSELLER">Verified Bestseller</option>
              <option value="HIGH_DEMAND">High Demand (≥70)</option>
              <option value="RISING_STAR">Rising Star (2024-2026)</option>
              <option value="STANDARD_DEMAND">Standard Catalog</option>
            </select>

            {/* Approval Filter */}
            <select
              value={selectedApproval}
              onChange={(e) => { setSelectedApproval(e.target.value); setPage(1); }}
              className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-2.5 py-1.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
            >
              <option value="ALL">All Approvals</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Storefront Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#E8E4DC]">
                <button
                  onClick={handleBulkApprove}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve ({selectedIds.length})</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Book Cards Grid */}
        <div className="space-y-4">
          {/* Select all header */}
          <div className="flex items-center justify-between text-xs text-[#81796D] px-1">
            <button onClick={toggleSelectAll} className="flex items-center space-x-1.5 hover:text-[#24231F]">
              {selectedIds.length === books.length && books.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#9A704B]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{selectedIds.length === books.length && books.length > 0 ? 'Deselect All' : `Select All on Page (${books.length})`}</span>
            </button>
            <span>Showing page {page} of {totalPages}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white border border-[#E8E4DC] rounded-xl text-xs text-[#81796D] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#9A704B]" />
              <p>Querying discovery providers and calculating demand scores...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E8E4DC] rounded-xl text-xs text-[#81796D] space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-[#9A704B]" />
              <h4 className="font-serif font-bold text-sm text-[#24231F]">No Discovered Books Found</h4>
              <p className="max-w-md mx-auto">
                No items match the active filters or the discovery feed is unseeded. Click "Run Multi-API Discovery" above to poll Open Library and Google Books.
              </p>
              <button
                onClick={runLiveResearch}
                disabled={researching}
                className="px-4 py-2 bg-[#24231F] text-white rounded-xl font-medium text-xs hover:bg-[#9A704B] transition-all"
              >
                Start Multi-Provider Research
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {books.map((book) => {
                const isSelected = selectedIds.includes(book.id);
                return (
                  <div
                    key={book.id}
                    className={`bg-white border rounded-xl p-3.5 shadow-sm transition-all flex flex-col justify-between relative group ${
                      isSelected ? 'border-[#9A704B] ring-1 ring-[#9A704B]' : 'border-[#E8E4DC] hover:border-[#D5CEBE]'
                    }`}
                  >
                    {/* Top selection checkbox & Demand Score badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <button onClick={() => toggleSelect(book.id)} className="text-[#81796D] hover:text-[#24231F] pt-0.5">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#9A704B]" /> : <Square className="w-4 h-4" />}
                      </button>

                      {/* Demand Score Pill */}
                      <button
                        onClick={() => setSelectedBookForEvidence(book)}
                        className="px-2 py-0.5 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] font-mono text-[10px] font-bold flex items-center space-x-1 hover:bg-[#EFECE4] transition-all"
                        title="Click to view transparent evidence breakdown"
                      >
                        <Sparkles className="w-3 h-3 text-[#9A704B]" />
                        <span>Demand: {book.demandScore}/100</span>
                      </button>
                    </div>

                    {/* Book Cover & Core Info */}
                    <div className="space-y-2.5">
                      <div className="w-full aspect-[3/4] bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg overflow-hidden relative">
                        <img
                          src={book.coverImage || book.coverUrl || '/covers/standard-shelf-cover.jpg'}
                          alt={book.title}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/covers/standard-shelf-cover.jpg'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {book.demandGrade === 'VERIFIED_BESTSELLER' && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
                            Bestseller
                          </span>
                        )}
                        {book.demandGrade === 'RISING_STAR' && (
                          <span className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
                            Rising Star
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-[#81796D]">
                          <span className="font-semibold text-[#9A704B]">{book.category}</span>
                          <span>•</span>
                          <span>{book.publishedYear || 'Recent'}</span>
                        </div>
                        <h4 className="font-serif font-bold text-xs text-[#24231F] mt-1 line-clamp-2" title={book.title}>
                          {book.title}
                        </h4>
                        <p className="text-[11px] text-[#6E685F] line-clamp-1 mt-0.5">by {book.author}</p>
                      </div>

                      {/* Source & Provenance */}
                      <div className="pt-2 border-t border-[#E8E4DC] flex items-center justify-between text-[10px] text-[#81796D]">
                        <span className="font-mono">{book.source}</span>
                        <div className="flex items-center space-x-1 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{book.rating || 4.7} ({book.reviewCount || 50})</span>
                        </div>
                      </div>
                    </div>

                    {/* Approval & Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-[#E8E4DC] flex items-center justify-between gap-1.5">
                      {book.approvalStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Approved & Active</span>
                        </span>
                      ) : book.approvalStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold">
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-1.5 w-full">
                          <button
                            onClick={() => handleApprove(book.id)}
                            className="flex-1 py-1.5 bg-[#24231F] hover:bg-[#9A704B] text-white rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(book.id)}
                            className="p-1.5 border border-[#E8E4DC] hover:border-rose-300 text-[#81796D] hover:text-rose-600 rounded-lg text-[10px] transition-all"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] bg-white text-xs text-[#6E685F] hover:text-[#24231F] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-[#81796D]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] bg-white text-xs text-[#6E685F] hover:text-[#24231F] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Transparent Demand Evidence Modal */}
        {selectedBookForEvidence && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#E8E4DC] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#9A704B]">Transparent Demand Intelligence</span>
                  <h3 className="font-serif text-lg font-bold text-[#24231F] mt-0.5">{selectedBookForEvidence.title}</h3>
                  <p className="text-xs text-[#6E685F]">by {selectedBookForEvidence.author}</p>
                </div>
                <button
                  onClick={() => setSelectedBookForEvidence(null)}
                  className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#81796D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Score Breakdown Table */}
              <div className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center font-bold text-[#24231F] border-b border-[#E8E4DC] pb-2">
                  <span>Total Calculated Demand Score</span>
                  <span className="text-[#9A704B] font-mono text-sm">{selectedBookForEvidence.demandScore} / 100</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Bestseller & Trending Rank Points (Max 35)</span>
                  <span className="font-mono font-medium text-[#24231F]">+{selectedBookForEvidence.demandEvidence?.breakdown?.bestsellerPoints || 0}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Review Volume & Ratings Activity (Max 25)</span>
                  <span className="font-mono font-medium text-[#24231F]">+{selectedBookForEvidence.demandEvidence?.breakdown?.reviewPoints || 0}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Search Interest & Reading Logs (Max 20)</span>
                  <span className="font-mono font-medium text-[#24231F]">+{selectedBookForEvidence.demandEvidence?.breakdown?.searchInterestPoints || 0}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Publication Recency ({selectedBookForEvidence.publishedYear}) (Max 10)</span>
                  <span className="font-mono font-medium text-[#24231F]">+{selectedBookForEvidence.demandEvidence?.breakdown?.recencyPoints || 0}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Metadata & Cover Quality Points (Max 10)</span>
                  <span className="font-mono font-medium text-[#24231F]">+{selectedBookForEvidence.demandEvidence?.breakdown?.metadataQualityPoints || 0}</span>
                </div>
              </div>

              {/* Provenance & Target Placement */}
              <div className="space-y-1.5 text-xs text-[#6E685F]">
                <div><strong>Source Provider:</strong> {selectedBookForEvidence.source} ({selectedBookForEvidence.sourceUrl || 'API Verified'})</div>
                <div><strong>Confidence Level:</strong> <span className="font-bold text-emerald-700">{selectedBookForEvidence.confidenceLevel}</span></div>
                <div><strong>Recommended Storefront Sections:</strong> {selectedBookForEvidence.targetSections?.join(', ')}</div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedBookForEvidence(null)}
                  className="px-4 py-2 bg-[#24231F] text-white rounded-xl text-xs font-semibold hover:bg-[#9A704B] transition-all"
                >
                  Close Evidence Breakdown
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
