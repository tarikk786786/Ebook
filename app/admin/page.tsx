'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Database, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Eye, 
  EyeOff, 
  Edit3, 
  ArrowLeft, 
  FolderCheck,
  Server,
  Zap,
  HardDrive,
  FileCheck,
  Sliders,
  CheckSquare,
  Square,
  ExternalLink,
  Lock,
  Key,
  LogOut,
  Globe,
  Wrench
} from 'lucide-react';

interface BookItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  priceInInr: number;
  originalPriceInInr: number;
  pages: number;
  format: string;
  fileSize: string;
  category: string;
  coverImage: string;
  fileName: string;
  status: 'DRAFT' | 'PUBLISHED';
  sourceTelegram?: string;
  telegramMessageId?: number;
  telegramLink?: string;
  sha256?: string;
}

interface AdminStats {
  telegram: {
    status: string;
    apiIdConfigured: boolean;
    sessionName: string;
    clientAccount: string;
    configuredSourcesCount: number;
    sources: Array<{ id: string; name: string; type: string; status: string; indexedPdfs: number }>;
  };
  inventory: {
    totalDiscoveredTelegramInventory: number;
    desktopTbooksLibraryCount: number;
    totalCatalogItems: number;
    publishedCount: number;
    draftCount: number;
    formatsSupported: string[];
    storageMb: number;
    storageFiles: number;
    metadataCompletionRate: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sources' | 'pipeline'>('inventory');

  // Admin Zero-Trust Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const getActiveToken = () => {
    if (adminToken) return adminToken;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('anontrove_admin_secret') || '';
    }
    return '';
  };

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const token = getActiveToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('x-admin-token', token);
    }
    return fetch(url, { ...options, headers });
  };

  const verifyAndLogin = async (tokenCandidate: string) => {
    if (!tokenCandidate || tokenCandidate.trim().length < 8) {
      setAuthError('Please enter a valid administrative access secret.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-token': tokenCandidate.trim() },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(tokenCandidate.trim());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('anontrove_admin_secret', tokenCandidate.trim());
        }
        setIsAuthenticated(true);
        setStats(data.stats);
        loadBooksWithToken(tokenCandidate.trim());
      } else {
        setAuthError(data.error || 'Access Denied: Invalid Administrative Secret.');
      }
    } catch (e: any) {
      setAuthError('Connection error during admin validation.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('anontrove_admin_secret');
    }
    setAdminToken('');
    setIsAuthenticated(false);
    setStats(null);
    setBooks([]);
  };

  const fetchStats = async () => {
    try {
      const res = await adminFetch('/api/admin/stats');
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBooksWithToken = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/books', {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/books');
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('anontrove_admin_secret') : null;
    if (saved) {
      verifyAndLogin(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const handleToggleStatus = async (bookId: string) => {
    try {
      setUpdating(true);
      const res = await adminFetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', bookId })
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.map(b => b.id === bookId ? data.updatedBook : b));
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkSetStatus = async (targetStatus: 'PUBLISHED' | 'DRAFT') => {
    if (selectedIds.length === 0) return;
    try {
      setUpdating(true);
      const res = await adminFetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_SET_STATUS',
          bookIds: selectedIds,
          updates: { status: targetStatus }
        })
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.map(b => selectedIds.includes(b.id) ? { ...b, status: targetStatus } : b));
        setSelectedIds([]);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      setUpdating(true);
      const res = await adminFetch('/api/admin/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BOOK',
          bookId: editingBook.id,
          updates: editingBook
        })
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.map(b => b.id === editingBook.id ? data.updatedBook : b));
        setEditingBook(null);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || b.category === categoryFilter;
      const matchesSearch = searchQuery.trim() === '' ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.sourceTelegram && b.sourceTelegram.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [books, statusFilter, categoryFilter, searchQuery]);

  const allCategories = useMemo(() => {
    const set = new Set(books.map(b => b.category));
    return ['ALL', ...Array.from(set)];
  }, [books]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBooks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBooks.map(b => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AnonTrove Admin Enclave</h1>
              <p className="text-xs text-slate-400">Zero-Trust Protected Administrative Portal</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLogin(secretInput); }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Administrative Access Secret</span>
                <span className="text-[10px] text-slate-500 font-mono">ADMIN_ACCESS_SECRET</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter secret token..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Vault</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#121826]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/" 
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white transition-colors"
              title="Return to Public Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white">AnonTrove Admin Vault</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded">
                  Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Telegram Ebook Intelligence & Publishing Control</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => { fetchStats(); fetchBooks(); }}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/tools"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-400 hover:border-amber-500/50 hover:text-white transition-colors"
              title="Manage Ebook Tools Directory"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tools Manager</span>
            </Link>
            <Link
              href="/admin/enrichment"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 hover:border-amber-500/80 hover:text-white transition-colors"
              title="Master Metadata, Authentic Covers & Author Enrichment Engine"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Enrichment Engine</span>
            </Link>
            <Link
              href="/admin/discovery"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 hover:border-emerald-500/80 hover:text-white transition-colors"
              title="Global 1,000 Startup and Business Book Discovery Engine"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">1,000 Discovery</span>
            </Link>
            <Link
              href="/admin/scraper"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-teal-400 hover:border-teal-500/50 hover:text-white transition-colors"
              title="Manage Universal Ebook Scraper and Discovery"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Universal Scraper</span>
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-950 transition-colors"
            >
              View Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-xs font-medium text-rose-300 transition-colors"
              title="Sign Out of Admin Enclave"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* KPI Banner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Telegram MTProto Session</p>
              <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Session
              </h3>
              <p className="text-[11px] text-emerald-400/90 mt-1">Enterprise Node (Authenticated)</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Discovered Telegram Files</p>
              <h3 className="text-lg font-bold text-white mt-1">
                {stats?.inventory.totalDiscoveredTelegramInventory.toLocaleString() || '10,417'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Across 5 configured channels</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Published / Live in Store</p>
              <h3 className="text-lg font-bold text-white mt-1">
                {stats?.inventory.publishedCount ?? books.filter(b => b.status === 'PUBLISHED').length}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {books.length} Total
                </span>
              </h3>
              <p className="text-[11px] text-amber-400/90 mt-1">
                {stats?.inventory.draftCount ?? books.filter(b => b.status === 'DRAFT').length} in Draft Mode
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Storage & Integrity</p>
              <h3 className="text-lg font-bold text-white mt-1">
                {stats?.inventory.storageMb ?? '624.5'} MB
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1">SHA-256 Deduplicated</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'inventory' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ebook Inventory ({filteredBooks.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'sources' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Configured Telegram Sources (5)
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'pipeline' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import Architecture & Storage
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter and Bulk Bar */}
            <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by title, author, file or channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 max-w-[160px]"
                >
                  {allCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Bulk actions */}
              {selectedIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1">
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedIds.length} Selected
                  </span>
                  <button
                    onClick={() => handleBulkSetStatus('PUBLISHED')}
                    disabled={updating}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-medium text-[11px] rounded transition-colors"
                  >
                    Bulk Publish
                  </button>
                  <button
                    onClick={() => handleBulkSetStatus('DRAFT')}
                    disabled={updating}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-medium text-[11px] rounded transition-colors"
                  >
                    Bulk Draft
                  </button>
                </div>
              )}
            </div>

            {/* Inventory Table */}
            <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length === filteredBooks.length && filteredBooks.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Cover & Title</th>
                      <th className="p-3">Author</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Size / Format</th>
                      <th className="p-3">Telegram Source</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                          Loading ebook catalogue...
                        </td>
                      </tr>
                    ) : filteredBooks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No ebooks match the selected query.
                        </td>
                      </tr>
                    ) : (
                      filteredBooks.map((book) => {
                        const isSelected = selectedIds.includes(book.id);
                        if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AnonTrove Admin Enclave</h1>
              <p className="text-xs text-slate-400">Zero-Trust Protected Administrative Portal</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLogin(secretInput); }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Administrative Access Secret</span>
                <span className="text-[10px] text-slate-500 font-mono">ADMIN_ACCESS_SECRET</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter secret token..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Vault</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
                          <tr key={book.id} className={`hover:bg-slate-900/50 transition-colors ${isSelected ? 'bg-emerald-950/20' : ''}`}>
                            <td className="p-3 text-center">
                              <button onClick={() => toggleSelectOne(book.id)} className="text-slate-400 hover:text-white">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-8 h-11 object-cover rounded bg-slate-950 border border-slate-800 shrink-0"
                                  onError={(e) => {
                                    (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44"><rect width="32" height="44" fill="%231e293b"/><text x="16" y="24" font-size="8" fill="%2364748b" text-anchor="middle">Book</text></svg>';
                                  }}
                                />
                                <div className="max-w-xs">
                                  <p className="font-medium text-white truncate">{book.title}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{book.subtitle}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 max-w-[130px] truncate">{book.author}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                                {book.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">
                              {book.fileSize} • {book.format.replace(' (DRM-Free)', '')}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-1 max-w-[160px] truncate text-slate-300 text-[11px]">
                                <span className="truncate">{book.sourceTelegram || 'tbooks library'}</span>
                                {book.telegramLink && (
                                  <a
                                    href={book.telegramLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 shrink-0"
                                    title="Open Original Telegram Post"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              {book.telegramMessageId && (
                                <span className="text-[10px] font-mono text-emerald-400/80">
                                  Msg #{book.telegramMessageId}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleStatus(book.id)}
                                disabled={updating}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                                  book.status === 'PUBLISHED'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/90'
                                    : 'bg-amber-950/80 text-amber-400 border border-amber-800/80 hover:bg-amber-900/90'
                                }`}
                                title="Click to toggle DRAFT / PUBLISHED mode"
                              >
                                {book.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <Link
                                  href={`/book/${book.slug}`}
                                  target="_blank"
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                                  title="View on Website"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => setEditingBook(book)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Edit Metadata"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="bg-[#121826] border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">5 Configured Telegram Target Sources</h3>
              <p className="text-xs text-slate-400 mb-4">
                These sources are monitored and indexed using Telethon MTProto session credentials stored in <code className="text-emerald-400">appinfo11.txt</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.telegram.sources.map((s) => (
                  <div key={s.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[170px]">{s.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[10px] text-emerald-400 font-mono">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">Peer ID: {s.id}</p>
                    <p className="text-[11px] text-slate-400">Type: {s.type}</p>
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Discovered Ebooks:</span>
                      <span className="font-mono text-emerald-400 font-bold">{s.indexedPdfs}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Automated Collection & Publishing Architecture</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> 1. Telegram Ingestion
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Telethon MTProto client reads historical and incoming messages with FloodWait handling, rate-limiting, and error-safe retry queues.
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="text-blue-400 font-semibold text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> 2. Metadata & Cover Generation
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    PyMuPDF extracts page counts, renders Page 1 as high-res cover JPEG (<code className="text-slate-300">/covers/*.jpg</code>), and computes SHA-256 hashes to prevent duplication.
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="text-purple-400 font-semibold text-xs flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4" /> 3. Modular Storage & Serving
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Files are stored in <code className="text-slate-300">private_storage/</code> with fallback to Telegram storage IDs. Download tokens are sealed with AES-256-GCM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-400" />
              Edit Ebook Metadata
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Book Title</label>
                <input
                  type="text"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Author</label>
                <input
                  type="text"
                  value={editingBook.author}
                  onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingBook.category}
                    onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingBook.priceInInr}
                    onChange={(e) => setEditingBook({ ...editingBook, priceInInr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingBook.description}
                  onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Status:</label>
                  <select
                    value={editingBook.status}
                    onChange={(e) => setEditingBook({ ...editingBook, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
