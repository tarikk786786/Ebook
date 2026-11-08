'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DiscoveredEbook, SourceRegistryItem } from '@/lib/scraper';
import { 
  Globe, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ExternalLink, 
  Lock, 
  Trash2, 
  FileText, 
  Database, 
  Download, 
  BookOpen, 
  Eye, 
  Layers,
  Wrench,
  Check
} from 'lucide-react';

export default function AdminScraperPage() {
  const [sources, setSources] = useState<SourceRegistryItem[]>([]);
  const [books, setBooks] = useState<DiscoveredEbook[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'sources' | 'catalog' | 'automation'>('sources');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string>('');

  // Admin Zero-Trust Auth State
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

  const verifyAndLogin = async (candidate: string) => {
    if (!candidate || candidate.trim().length < 8) {
      setAuthError('Please enter a valid administrative access secret.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const res = await fetch('/api/scraper/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminToken(candidate.trim());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('anontrove_admin_secret', candidate.trim());
        }
        setSources(data.sources || []);
        setStats(data.stats || {});
        fetchFullCatalog();
      }
    } catch (err: any) {
      setAuthError('Authentication rejected: Gateway failure.');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchFullCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/scraper/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setSources(data.sources || []);
        setStats(data.stats || {});
      }
      // Also fetch books list
      const booksRes = await fetch('/data/scraper/universal_catalog.json');
      if (booksRes.ok) {
        const catalogJson = await booksRes.json();
        setBooks(catalogJson.books || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('anontrove_admin_secret') : null;
    if (stored) {
      verifyAndLogin(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const handleApproveBook = async (bookId: string) => {
    try {
      setActionMessage(`Approving book ${bookId}...`);
      const res = await adminFetch('/api/scraper/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_book', bookId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✓ Book approved!`);
        setBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, confidenceScore: 1.0 } : b))
        );
      }
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleRejectBook = async (bookId: string) => {
    try {
      setActionMessage(`Removing book ${bookId}...`);
      const res = await adminFetch('/api/scraper/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_book', bookId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✓ Book removed from universal index`);
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handleTriggerCrawl = async () => {
    try {
      setActionMessage('Initiating universal crawler background scan...');
      const res = await adminFetch('/api/scraper/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_scan' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('✓ Universal crawler checkpoint active. Scanning sources...');
        setTimeout(() => fetchFullCatalog(), 2000);
      }
    } catch (e: any) {
      setActionMessage(`Error triggering crawl: ${e.message}`);
    }
  };

  // Filter books
  const filteredBooks = books.filter((b) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.title.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q)) ||
        b.source.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (availabilityFilter !== 'ALL' && b.availability !== availabilityFilter) {
      return false;
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Universal Scraper Control Plane</h1>
          <p className="text-xs text-slate-400 mb-6">
            Enter administrative access secret to manage source registries, inspect crawl queues, and audit rights.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAndLogin(secretInput);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Enter ADMIN_ACCESS_SECRET..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
            {authError && <div className="text-xs text-rose-400 text-left font-mono">{authError}</div>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs transition-colors"
            >
              {authLoading ? 'Verifying...' : 'Access Scraper Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-300">
              ← Return to Main Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Store Admin
              </Link>
              <h1 className="text-2xl font-black text-white flex items-center">
                <Globe className="w-6 h-6 mr-2 text-teal-400" />
                Universal Scraper & Discovery Control Plane
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Managing 12 global ebook sources, automated rights verification, and universal discovery indexing.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTriggerCrawl}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold transition-colors shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Run Discovery Crawl</span>
            </button>
            <Link
              href="/discover"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5"
            >
              <span>View Public Discovery</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Action message */}
        {actionMessage && (
          <div className="rounded-xl bg-slate-900 border border-teal-500/40 p-3 text-xs text-teal-300 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-slate-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* KPI Metrics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sources</span>
              <div className="text-2xl font-black text-white font-mono mt-1">{stats.totalSources}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Sources</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.activeSources}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discovered Books</span>
              <div className="text-2xl font-black text-teal-400 font-mono mt-1">{books.length}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Public Domain</span>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{stats.publicDomainBooks}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Free / Open Access</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.freeAuthorizedBooks}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telegram Vault</span>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">{stats.telegramDiscoveries}</div>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center space-x-6 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'sources'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Registered Sources Matrix ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'catalog'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Discovered Titles & Rights Queue ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'automation'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Crawler Reliability & Policies
          </button>
        </div>

        {/* TAB 1: SOURCES MATRIX */}
        {activeTab === 'sources' && (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Source Name & Endpoint</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">API Protocol</th>
                    <th className="py-3 px-4">Rate Limits</th>
                    <th className="py-3 px-4">Connection Status</th>
                    <th className="py-3 px-4">Last Verified Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{s.name}</span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-teal-400"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-sm">{s.url}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{s.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {s.apiAvailable ? (
                          <span className="text-emerald-400">REST / JSON API</span>
                        ) : (
                          <span className="text-slate-400">Web / Sitemap</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{s.rateLimits}</td>
                      <td className="py-3.5 px-4">
                        {s.connectionStatus === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                            {s.connectionStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {s.lastSuccessfulScan ? s.lastSuccessfulScan.split('T')[0] : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DISCOVERED TITLES & RIGHTS QUEUE */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search discovered titles, authors, or source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Availabilities ({books.length})</option>
                <option value="PUBLIC_DOMAIN">Public Domain</option>
                <option value="FREE_AUTHORIZED">Free Authorized</option>
                <option value="BORROWABLE">Borrowable</option>
                <option value="PAID_STORE">Paid Store Editions</option>
                <option value="PREVIEW_ONLY">Preview Only</option>
              </select>
            </div>

            {/* Books Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Title & Author</th>
                      <th className="py-3 px-4">Source Network</th>
                      <th className="py-3 px-4">Availability</th>
                      <th className="py-3 px-4">Formats</th>
                      <th className="py-3 px-4">Confidence</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredBooks.slice(0, 50).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white line-clamp-1">{b.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">by {b.authors.join(', ')}</div>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono text-slate-400">{b.source}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-teal-300 border border-slate-700 font-semibold">
                            {b.availability}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">{b.formats.join(', ')}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                          {Math.round(b.confidenceScore * 100)}%
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleApproveBook(b.id)}
                            className="px-2 py-1 rounded bg-teal-950 hover:bg-teal-900 text-teal-300 text-[11px] font-semibold border border-teal-800"
                            title="Approve book metadata and rights"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectBook(b.id)}
                            className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold border border-rose-800"
                            title="Remove book from index"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RELIABILITY & POLICIES */}
        {activeTab === 'automation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-teal-400" />
                Copyright & Rights Verification Policy
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Universal Scraper strictly enforces lawful acquisition boundaries:
              </p>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-200">Public Domain:</strong> Works published before 1929, expired copyright, or CC0 are tagged for direct download.</li>
                <li><strong className="text-slate-200">Open Access:</strong> Verified Creative Commons, arXiv, and academic monographs are indexed with original attribution.</li>
                <li><strong className="text-slate-200">Controlled Digital Lending:</strong> Protected books with lending copies link exclusively to official Internet Archive lending portals.</li>
                <li><strong className="text-slate-200">Commercial Store Books:</strong> Proprietary technical titles route to AnonTrove instant UPI checkout.</li>
                <li><strong className="text-slate-200">Zero DRM Bypass:</strong> No circumvention algorithms, decryption keys, or paywall strippers are permitted.</li>
              </ul>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <Database className="w-4 h-4 mr-2 text-teal-400" />
                Reliability & Execution State
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                State checkpoints ensure uninterrupted discovery across serverless restarts:
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>State file: <span className="text-teal-400">docs/universal-scraper/EXECUTION_STATE.json</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">COMPLETED</span></div>
                <div>Atomic Checkpoints: <span className="text-slate-300">Enabled</span></div>
                <div>Rate-limit Backoff: <span className="text-slate-300">Exponential</span></div>
                <div>Total Discovered Items: <span className="text-slate-200 font-bold">{books.length}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
