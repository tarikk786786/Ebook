'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Key,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface CoverStats {
  total: number;
  found: number;
  pending: number;
  notFound: number;
  review: number;
  progressPct: number;
  missing?: number;
}

interface Payload {
  success: boolean;
  googleBooksKeyConfigured?: boolean;
  stats?: CoverStats;
  bySource?: Record<string, number>;
  recent?: Array<{
    catalog_num: number;
    slug: string;
    title: string;
    author: string;
    status: string;
    source: string;
    cover_url?: string;
  }>;
  worker?: Record<string, unknown>;
  message?: string;
  error?: string;
}

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem('admin_token') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

export default function CoverRecoveryCenterPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, ctrl] = await Promise.all([
        fetch('/api/admin/cover-recovery', {
          headers: { 'x-admin-token': getAdminToken() },
          cache: 'no-store',
        }),
        fetch('/api/admin/cover-recovery/control', {
          headers: { 'x-admin-token': getAdminToken() },
          cache: 'no-store',
        }),
      ]);
      const json = (await res.json()) as Payload;
      const ctrlJson = await ctrl.json();
      if (!res.ok) {
        setError(json.error || `HTTP ${res.status}`);
        setData(null);
      } else {
        setData({ ...json, worker: ctrlJson?.status || {} });
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const runAction = async (action: string) => {
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/cover-recovery/control', {
        method: 'POST',
        headers: {
          'x-admin-token': getAdminToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, limit: 300, workers: 4 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMsg(json.error || `Action failed (${res.status})`);
      } else {
        setActionMsg(json.message || `Action ${action} ok`);
        await load();
      }
    } catch (e: any) {
      setActionMsg(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const stats = data?.stats;
  const worker = data?.worker || {};
  const paused = Boolean(worker.paused);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-emerald-400" />
              Ebook Image Scraping Center
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live recovery for 86,260 catalog records — local extract first, then authorized APIs.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs hover:border-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Could not load recovery stats</div>
              <div className="text-amber-200/80 text-xs mt-1">{error}</div>
              <div className="text-amber-200/70 text-xs mt-2">
                Sign in on /admin first so your admin token is stored, then refresh.
              </div>
            </div>
          </div>
        )}

        <div
          className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${
            data?.googleBooksKeyConfigured
              ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-100'
              : 'border-rose-800/50 bg-rose-950/30 text-rose-100'
          }`}
        >
          <Key className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <div className="font-medium">
              Google Books API key: {data?.googleBooksKeyConfigured ? 'Configured' : 'Missing'}
            </div>
            {!data?.googleBooksKeyConfigured && (
              <div className="text-xs text-rose-100/80 space-y-1">
                <p>
                  Without a key, Google Books returns HTTP 429. Open Library and Internet Archive still run.
                </p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>
                    Open{' '}
                    <a
                      className="underline inline-flex items-center gap-1"
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Create credentials → API key (restrict to Books API)</li>
                  <li>
                    Set <code className="text-rose-50">GOOGLE_BOOKS_API_KEY</code> in{' '}
                    <code className="text-rose-50">.env.local</code> and Vercel
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total ebooks', value: stats?.total, icon: BookOpen },
            { label: 'Found covers', value: stats?.found, icon: CheckCircle2 },
            { label: 'Pending', value: stats?.pending },
            { label: 'Not found', value: stats?.notFound },
            { label: 'Review', value: stats?.review },
            { label: 'Progress', value: stats ? `${stats.progressPct}%` : '—' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{card.label}</div>
              <div className="text-xl font-semibold mt-1 tabular-nums">
                {card.value ?? (loading ? '…' : '—')}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-slate-200">Worker controls</h2>
            <div className="text-xs text-slate-400">
              {paused ? 'Paused' : worker.running ? 'Running' : 'Idle'}
              {typeof worker.done === 'number' ? ` · done ${String(worker.done)}` : ''}
              {typeof worker.found === 'number' ? ` · found ${String(worker.found)}` : ''}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => runAction('start')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-xs"
            >
              <Play className="w-3.5 h-3.5" /> Start discovery
            </button>
            <button
              disabled={busy}
              onClick={() => runAction('pause')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-800/70 hover:bg-amber-700 text-xs"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
            <button
              disabled={busy}
              onClick={() => runAction('resume')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs"
            >
              Resume
            </button>
            <button
              disabled={busy}
              onClick={() => runAction('retry_failures')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry failures
            </button>
            <button
              disabled={busy}
              onClick={() => runAction('missing_only')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs"
            >
              Recover missing only
            </button>
          </div>
          {actionMsg && <p className="text-xs text-slate-400">{actionMsg}</p>}
          <pre className="text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap bg-black/40 rounded-lg p-3 border border-slate-800 overflow-x-auto">{`CLI:
python scripts/run_cover_recovery_batch.py --pending-from-db --limit 300 --workers 4
python scripts/fetch_all_86k_covers.py --always-download --workers 4 --export-every 100
python scripts/generate_cover_reports.py
python scripts/cover_worker_control.py pause|resume|status`}</pre>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-medium text-slate-200 mb-3">Found by source</h2>
            <div className="space-y-2">
              {Object.entries(data?.bySource || {}).length === 0 && (
                <div className="text-xs text-slate-500">No found covers yet.</div>
              )}
              {Object.entries(data?.bySource || {}).map(([source, n]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{source}</span>
                  <span className="tabular-nums text-slate-100">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-medium text-slate-200 mb-3">Reports</h2>
            <p className="text-xs text-slate-400 mb-2">
              Generated under <code>data/reports/</code> via{' '}
              <code>python scripts/generate_cover_reports.py</code>
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc ml-4">
              <li>ebook_cover_results.csv</li>
              <li>missing_covers.csv</li>
              <li>failed_image_downloads.csv</li>
              <li>manual_review.csv</li>
              <li>duplicate_cover_images.csv</li>
              <li>cover_source_statistics.csv</li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-medium text-slate-200 mb-3">Recently recovered</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2">Slug</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent || []).map((row) => (
                  <tr key={row.catalog_num} className="border-b border-slate-900/80">
                    <td className="py-2 pr-3 tabular-nums text-slate-400">{row.catalog_num}</td>
                    <td className="py-2 pr-3 text-slate-200 max-w-[280px] truncate">{row.title}</td>
                    <td className="py-2 pr-3 text-emerald-300">{row.source}</td>
                    <td className="py-2 text-slate-400">{row.slug}</td>
                  </tr>
                ))}
                {!loading && !(data?.recent || []).length && (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-500 text-center">
                      No recovered rows yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
