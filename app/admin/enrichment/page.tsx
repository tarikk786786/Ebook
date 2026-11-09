'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Lock,
  Key,
  LogOut,
  ArrowLeft,
  Check,
  X,
  Eye,
  FileText,
  UserCheck,
  Download,
  Filter,
  Sliders,
  Sparkles,
  Award
} from 'lucide-react';

interface Stats {
  totalBooks: number;
  verifiedCount: number;
  needsReviewCount: number;
  withIsbnCount: number;
  withPublisherCount: number;
  withAuthorBioCount: number;
  verifiedCoversCount: number;
  totalAuthors: number;
  totalProvenances: number;
  recentAuditsCount: number;
}

export default function AdminEnrichmentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'VERIFIED' | 'NEEDS_REVIEW'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBookForModal, setSelectedBookForModal] = useState<any | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Check stored secret on mount
  useEffect(() => {
    const saved = localStorage.getItem('anontrove_admin_secret');
    if (saved) {
      verifyAndLogin(saved);
    }
  }, []);

  const verifyAndLogin = async (secret: string) => {
    if (!secret.trim()) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/enrichment', {
        headers: { 'x-admin-secret': secret }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('anontrove_admin_secret', secret);
        setStats(data.stats);
        setBooks(data.books);
        setTotalPages(data.pagination.totalPages);
      } else {
        setAuthError(data.error || 'Invalid Admin Authentication Secret');
      }
    } catch (e: any) {
      setAuthError('Failed to verify administrative credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('anontrove_admin_secret');
    setIsAuthenticated(false);
    setStats(null);
    setBooks([]);
  };

  const loadData = async (targetPage = page, status = selectedStatus, query = searchQuery) => {
    const secret = localStorage.getItem('anontrove_admin_secret');
    if (!secret) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '25',
        status,
        q: query
      });
      const res = await fetch(`/api/admin/enrichment?${params.toString()}`, {
        headers: { 'x-admin-secret': secret }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setBooks(data.books);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAction = async (bookId: string, action: 'APPROVE' | 'REJECT') => {
    const secret = localStorage.getItem('anontrove_admin_secret');
    if (!secret) return;

    try {
      const res = await fetch('/api/admin/enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ bookId, action })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`Book ${action === 'APPROVE' ? 'verified' : 'flagged'} successfully!`);
        setTimeout(() => setActionSuccessMessage(null), 3000);
        loadData();
        if (selectedBookForModal && (selectedBookForModal.id === bookId || selectedBookForModal.slug === bookId)) {
          setSelectedBookForModal((prev: any) => ({
            ...prev,
            verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'NEEDS_REVIEW'
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121826] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Book Enrichment Enclave</h1>
              <p className="text-xs text-slate-400">Multi-Source Provenance & Metadata Control</p>
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
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
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
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Enrichment Vault</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Dashboard
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#121826]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/admin" 
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white transition-colors"
              title="Return to Main Admin Enclave"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white">Catalogue Enrichment Engine</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded">
                  Live Provenance
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Open Library, Wikipedia & Google Books Metadata Verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="/all_ebooks_catalog.csv"
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 hover:border-emerald-500/50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-950 transition-colors"
            >
              Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 hover:bg-rose-900/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#121826] border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Total Curated Books</span>
              <span className="text-xl font-bold text-white font-mono">{stats.totalBooks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-1">High-Priority Catalog</span>
            </div>

            <div className="bg-[#121826] border border-emerald-800/40 rounded-xl p-3.5">
              <span className="text-[11px] text-emerald-400 block mb-1">Fully Verified</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{stats.verifiedCount.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-500/70 block mt-1">{Math.round((stats.verifiedCount / stats.totalBooks) * 100)}% Confidence Pass</span>
            </div>

            <div className="bg-[#121826] border border-amber-800/40 rounded-xl p-3.5">
              <span className="text-[11px] text-amber-400 block mb-1">Needs Review</span>
              <span className="text-xl font-bold text-amber-400 font-mono">{stats.needsReviewCount.toLocaleString()}</span>
              <span className="text-[10px] text-amber-500/70 block mt-1">Requires Evidence Check</span>
            </div>

            <div className="bg-[#121826] border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Verified ISBN-10/13</span>
              <span className="text-xl font-bold text-white font-mono">{stats.withIsbnCount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Bibliographic Match</span>
            </div>

            <div className="bg-[#121826] border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Author Biographies</span>
              <span className="text-xl font-bold text-sky-400 font-mono">{stats.totalAuthors.toLocaleString()}</span>
              <span className="text-[10px] text-sky-500/70 block mt-1">Wikipedia Reference</span>
            </div>

            <div className="bg-[#121826] border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block mb-1">Authentic Covers</span>
              <span className="text-xl font-bold text-white font-mono">{stats.verifiedCoversCount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Provenance Logged</span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                loadData(1, selectedStatus, e.target.value);
              }}
              placeholder="Search title, author, publisher, ISBN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Status:</span>
            {(['ALL', 'VERIFIED', 'NEEDS_REVIEW'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedStatus(s);
                  setPage(1);
                  loadData(1, s, searchQuery);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedStatus === s
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Editions' : s === 'VERIFIED' ? 'Verified (65%+)' : 'Needs Review'}
              </button>
            ))}
          </div>
        </div>

        {/* Enriched Books Table */}
        <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Cover</th>
                  <th className="py-3 px-4">Book Title & Author</th>
                  <th className="py-3 px-4">Publisher & Year</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {books.map((book) => {
                  const isVerified = book.verificationStatus === 'VERIFIED';
                  const conf = book.confidenceScore || 40;

                  return (
                    <tr key={book.id || book.slug} className="hover:bg-slate-900/40 transition-colors">
                      {/* Cover Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-14 rounded bg-slate-900 border border-slate-800 overflow-hidden relative">
                          <img
                            src={book.coverImage || `/api/covers/${book.slug}`}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `/api/covers/${book.slug}`;
                            }}
                          />
                        </div>
                      </td>

                      {/* Title & Author */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-white line-clamp-1">{book.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">By {book.author || 'Unknown'}</p>
                        <span className="text-[9px] text-[#9A704B] font-mono mt-0.5 inline-block">
                          {book.category}
                        </span>
                      </td>

                      {/* Publisher & Year */}
                      <td className="py-3 px-4">
                        <p className="text-slate-300 line-clamp-1">{book.publisher || '—'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{book.publicationYear || book.publishedYear || '—'}</p>
                      </td>

                      {/* ISBN */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {book.isbn13 || book.isbn || (
                          <span className="text-slate-600">Pending</span>
                        )}
                      </td>

                      {/* Confidence Score Bar */}
                      <td className="py-3 px-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className={conf >= 80 ? 'text-emerald-400' : conf >= 65 ? 'text-teal-400' : 'text-amber-400'}>
                              {conf}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                conf >= 80 ? 'bg-emerald-500' : conf >= 65 ? 'bg-teal-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          <span>{book.verificationStatus || 'NEEDS_REVIEW'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedBookForModal(book)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Inspect Evidence"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isVerified ? (
                            <button
                              onClick={() => handleBookAction(book.id || book.slug, 'REJECT')}
                              className="p-1.5 rounded bg-amber-950/40 border border-amber-900/60 hover:bg-amber-900/60 text-amber-400 transition-colors"
                              title="Flag for Review"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBookAction(book.id || book.slug, 'APPROVE')}
                              className="p-1.5 rounded bg-emerald-950/40 border border-emerald-900/60 hover:bg-emerald-900/60 text-emerald-400 transition-colors"
                              title="Verify & Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages || 1}</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); loadData(p); }}
                className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:text-white"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); loadData(p); }}
                className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Source Evidence Inspector */}
        {selectedBookForModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400">Bibliographic Provenance</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedBookForModal.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedBookForModal(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 aspect-[3/4] rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={selectedBookForModal.coverImage || `/api/covers/${selectedBookForModal.slug}`}
                    alt={selectedBookForModal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="sm:col-span-2 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">AUTHOR</span>
                    <span className="font-semibold text-white">{selectedBookForModal.author}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PUBLISHER</span>
                    <span className="text-slate-200">{selectedBookForModal.publisher || 'Independent / Not Documented'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PUBLICATION YEAR</span>
                    <span className="font-mono text-slate-200">{selectedBookForModal.publicationYear || selectedBookForModal.publishedYear || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ISBN-13 / ISBN-10</span>
                    <span className="font-mono text-emerald-400">{selectedBookForModal.isbn13 || selectedBookForModal.isbn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">VERIFICATION SCORE</span>
                    <span className="font-mono text-white font-bold">{selectedBookForModal.confidenceScore || 40}%</span>
                  </div>
                </div>
              </div>

              {selectedBookForModal.authorProfile && (
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1.5 text-sky-400 font-semibold text-[11px]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Wikipedia Author Biography</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedBookForModal.authorProfile.shortBio}
                  </p>
                  {selectedBookForModal.authorProfile.wikipediaUrl && (
                    <a
                      href={selectedBookForModal.authorProfile.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline text-[10px] inline-flex items-center gap-1 mt-1"
                    >
                      <span>Read full Wikipedia profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedBookForModal(null)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleBookAction(selectedBookForModal.id || selectedBookForModal.slug, 'APPROVE');
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Edition</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
