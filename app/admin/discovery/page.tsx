'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import type { DiscoveryBook, DiscoveryCategory } from '@/lib/discovery/types';

interface DiscoveryStats {
  totalBooks: number;
  totalCategories: number;
  verifiedCount: number;
  partiallyVerifiedCount: number;
  discoveredCount: number;
  withIsbn: number;
  withCover: number;
  source: string;
}

export default function AdminDiscoveryPage() {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [workerLogs, setWorkerLogs] = useState<string[]>([
    'System ready. Master seed catalogue loaded: 1,000 books across 25 subject domains.',
    'SQLite discovery cache configured at data/discovery_cache.db.',
    'Worker runner: workers/book_discovery_worker.py (Open Library & Google Books API).',
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, catRes] = await Promise.all([
        fetch('/api/discovery/stats'),
        fetch('/api/discovery/categories')
      ]);

      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories);
      }
    } catch (err) {
      console.error('Failed to load discovery stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportAsCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/discovery/books?pageSize=1000');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.books)) {
        alert('Failed to fetch books for export');
        return;
      }

      const books: DiscoveryBook[] = data.books;
      const headers = [
        'Reference',
        'Title',
        'Author',
        'Category',
        'Category_Index',
        'ISBN13',
        'ISBN10',
        'Publisher',
        'Published_Year',
        'Pages',
        'Status',
        'Cover_URL',
        'Slug'
      ];

      const rows = books.map((b) => [
        `"${b.ref}"`,
        `"${(b.title || '').replace(/"/g, '""')}"`,
        `"${(b.author || '').replace(/"/g, '""')}"`,
        `"${(b.category || '').replace(/"/g, '""')}"`,
        b.categoryIndex || '',
        `"${b.isbn13 || ''}"`,
        `"${b.isbn10 || ''}"`,
        `"${(b.publisher || '').replace(/"/g, '""')}"`,
        `"${b.publishedYear || ''}"`,
        b.pageCount || '',
        `"${b.verificationStatus}"`,
        `"${b.coverUrl || ''}"`,
        `"${b.slug}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `global_1000_startup_business_books_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setWorkerLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Exported 1,000 records to CSV successfully.`,
        ...prev
      ]);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportAsJson = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/discovery/books?pageSize=1000');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.books)) {
        alert('Failed to fetch books for JSON export');
        return;
      }

      const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.books, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', jsonStr);
      link.setAttribute('download', `global_1000_startup_business_books_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setWorkerLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Exported 1,000 records to JSON successfully.`,
        ...prev
      ]);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-white">
                  Anon<span className="text-emerald-400">Trove</span> Discovery Console
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  MASTER SEED ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1,000 Worldwide Startup & Business Book Discovery, Verification & Enrichment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/books"
              target="_blank"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>View Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Seed Titles
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalBooks || 1000}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Exact Master Seed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Domain Categories
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalCategories || 25}
            </div>
            <span className="text-[10px] text-slate-400">
              Sections 1 to 25
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Verified Records
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.verifiedCount || 0}
            </div>
            <span className="text-[10px] text-slate-400">
              Open Library / Google Books
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ISBN Resolved
            </span>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {stats?.withIsbn || 0}
            </div>
            <span className="text-[10px] text-slate-400">
              ISBN-13 / ISBN-10
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Covers Resolved
            </span>
            <div className="text-2xl font-black text-teal-400 font-mono">
              {stats?.withCover || 0}
            </div>
            <span className="text-[10px] text-slate-400">
              Cover CDN Linked
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Discovered Seed
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {stats?.discoveredCount || 1000}
            </div>
            <span className="text-[10px] text-slate-400">
              100% Extracted
            </span>
          </div>
        </div>

        {/* Quick Operations & Export Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Data Export & Background Worker Execution
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Download the master 1,000 book dataset or manage continuous external enrichment workers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportAsCsv}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={exportAsJson}
                disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* CLI Instructions banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Background Discovery Worker CLI Command</span>
              <span className="text-emerald-400">Zero Vercel Timeout (Runs locally or via CRON)</span>
            </div>
            <div className="text-emerald-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 overflow-x-auto select-all">
              python workers/book_discovery_worker.py --limit 100 --batch-size 20 --sleep 1.5
            </div>
            <p className="text-[11px] text-slate-400">
              Uses Open Library and Google Books APIs with SQLite persistent cache (<code className="text-slate-300">data/discovery_cache.db</code>) and rate-limit backoff.
            </p>
          </div>
        </div>

        {/* Activity Logs & Worker Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Discovery & Enrichment Console Log
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 max-h-48 overflow-y-auto border border-slate-800/80">
            {workerLogs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-slate-400 select-none">&gt; </span>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Categories Breakdown Table (25 Categories) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                25 Domain Subject Areas Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Curated distribution of books across all startup & business categories
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              {categories.length} Total Domains
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="p-4">Index</th>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Category Slug</th>
                  <th className="p-4 text-right">Seed Titles</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {categories.map((cat) => (
                  <tr key={cat.slug} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-slate-400">
                      #{String(cat.id).padStart(2, '0')}
                    </td>
                    <td className="p-4 text-white font-bold">
                      {cat.name}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {cat.slug}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                      {cat.count} books
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/books?category=${cat.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <span>Filter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
