'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, ShieldCheck, AlertCircle, ClipboardList } from 'lucide-react';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

type Row = {
  requestId: string;
  title: string;
  author: string | null;
  requesterEmail: string;
  status: string;
  upvoteCount: number;
  duplicateOf: string | null;
  createdAt: string;
};

export default function AdminRequestsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/requests?${params}`, {
        headers: { 'x-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setSummary(json.summary || {});
      setTotal(json.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const setRequestStatus = async (requestId: string, nextStatus: string, duplicateOf?: string) => {
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getAdminToken(),
      },
      body: JSON.stringify({
        action: 'update_status',
        requestId,
        status: nextStatus,
        duplicateOf,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Update failed');
      return;
    }
    await load();
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-amber-400" />
              Ebook Requests
            </h1>
            <p className="text-sm text-slate-400 mt-1">Triage reader requests and duplicate merges.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/contributions" className="px-3 py-2 rounded-lg border border-slate-700 text-xs">
              Contributions
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> {total} requests
          </span>
          {Object.entries(summary).map(([k, v]) => (
            <span key={k} className="font-mono">
              {k}: {v}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, author, email…"
                className="pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs w-56"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All statuses</option>
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="fulfilled">fulfilled</option>
              <option value="duplicate">duplicate</option>
              <option value="closed">closed</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Book</th>
                  <th className="px-3 py-2">Requester</th>
                  <th className="px-3 py-2">Upvotes</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.requestId} className="border-t border-slate-800/80">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.title}</div>
                      <div className="text-slate-500">{row.author || '—'}</div>
                    </td>
                    <td className="px-3 py-2">{row.requesterEmail}</td>
                    <td className="px-3 py-2 font-mono">{row.upvoteCount}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{row.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(['in_progress', 'fulfilled', 'closed'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setRequestStatus(row.requestId, s)}
                            className="px-2 py-1 rounded border border-slate-700 hover:border-amber-500/40"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                      No requests in queue.
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
