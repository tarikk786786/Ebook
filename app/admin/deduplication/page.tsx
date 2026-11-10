'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileWarning,
  HardDrive,
  Layers,
  ShieldAlert,
  Download,
  Play,
  Undo2,
  Search,
} from 'lucide-react';

type Member = {
  catalog_num: number;
  path?: string;
  sha256?: string;
  title?: string;
  author?: string;
  file_name?: string;
  edition?: string;
  volume?: string;
  isbn13?: string;
  cover_url?: string;
  size_bytes?: number;
  is_canonical?: number;
};

type Group = {
  group_id: string;
  confidence: string;
  reason: string;
  canonical_catalog_num: number;
  member_count: number;
  total_bytes: number;
  status: string;
  auto_eligible: number;
  estimated_recoverable_bytes: number;
  members: Member[];
};

type Summary = {
  totalEbookRecords: number;
  uniqueFileHashes: number;
  exactDuplicateFiles: number;
  suspectedDuplicateBooks: number;
  duplicateMetadataGroups: number;
  duplicateImages: number;
  booksRequiringReview: number;
  recordsEligibleForSafeMerge: number;
  estimatedStorageRecoverableBytes: number;
  mergedRecords: number;
  openHighGroups: number;
  suppression?: { suppressedCount: number; policy?: string | null };
  message?: string;
};

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.localStorage.getItem('admin_token') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

function formatBytes(n?: number) {
  const v = Number(n || 0);
  if (v < 1024) return `${v} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${(v / 1024 ** 3).toFixed(2)} GB`;
}

export default function DeduplicationCenterPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string>('HIGH');
  const [status, setStatus] = useState<string>('');
  const [autoOnly, setAutoOnly] = useState(false);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Group | null>(null);
  const [reports, setReports] = useState<Array<{ name: string; exists: boolean; sizeBytes: number }>>(
    []
  );

  const headers = useMemo(() => ({ 'x-admin-token': getAdminToken() }), []);

  const loadSummary = useCallback(async () => {
    const res = await fetch('/api/admin/deduplication?view=summary', {
      headers: { 'x-admin-token': getAdminToken() },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    setSummary(json.summary);
    setReports(json.reports || []);
  }, []);

  const loadGroups = useCallback(async () => {
    const params = new URLSearchParams({ view: 'groups', limit: '40', offset: '0' });
    if (confidence) params.set('confidence', confidence);
    if (status) params.set('status', status);
    if (autoOnly) params.set('autoEligible', '1');
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/admin/deduplication?${params}`, {
      headers: { 'x-admin-token': getAdminToken() },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    setGroups(json.groups || []);
    setTotal(json.total || 0);
  }, [confidence, status, autoOnly, q]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadSummary(), loadGroups()]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadGroups]);

  useEffect(() => {
    reload();
  }, [reload]);

  const runAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/deduplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || json.stderrTail || `Action failed (${res.status})`);
      }
      setMessage(
        action === 'scan'
          ? 'Dry-run scan completed.'
          : action === 'apply-auto'
            ? `Applied soft-remove. Suppressed via catalog map.`
            : action === 'rollback'
              ? 'Rollback completed from latest backup.'
              : `${action} ok`
      );
      if (json.summary) setSummary(json.summary);
      await loadGroups();
      await loadSummary();
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const exportFile = async (name: string) => {
    const res = await fetch(
      `/api/admin/deduplication?view=export&file=${encodeURIComponent(name)}`,
      { headers }
    );
    if (!res.ok) {
      setError(`Export failed for ${name}`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'Total ebook records', value: summary?.totalEbookRecords, icon: Layers },
    { label: 'Unique file hashes', value: summary?.uniqueFileHashes, icon: HardDrive },
    { label: 'Exact duplicate file groups', value: summary?.exactDuplicateFiles, icon: Copy },
    { label: 'Suspected duplicate books', value: summary?.suspectedDuplicateBooks, icon: FileWarning },
    { label: 'Duplicate metadata groups', value: summary?.duplicateMetadataGroups, icon: Layers },
    { label: 'Duplicate images', value: summary?.duplicateImages, icon: Copy },
    { label: 'Books requiring review', value: summary?.booksRequiringReview, icon: ShieldAlert },
    {
      label: 'Eligible for safe merge',
      value: summary?.recordsEligibleForSafeMerge,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Copy className="w-6 h-6 text-cyan-400" />
              Ebook Deduplication Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Detect exact file duplicates and review suspected metadata overlaps. Only exact SHA-256 /
              same-filepath groups are auto-eligible. Medium/low candidates never auto-delete.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runAction('scan', { skipHash: true, skipCovers: true })}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs hover:border-cyan-500/60"
            >
              <Play className={`w-3.5 h-3.5 ${busy === 'scan' ? 'animate-pulse' : ''}`} />
              Dry-run scan
            </button>
            <button
              onClick={() => runAction('bulk-approve-high')}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs hover:border-emerald-500/60"
            >
              Bulk approve exact
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    'Soft-remove AUTO-ELIGIBLE exact duplicates only?\n\nThis writes suppression mapping, quarantines redundant files, and keeps a rollback backup. No hard deletes.'
                  )
                ) {
                  runAction('apply-auto');
                }
              }}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-700/80 border border-cyan-500/50 text-xs hover:bg-cyan-600"
            >
              Apply safe merge
            </button>
            <button
              onClick={() => {
                if (confirm('Rollback the latest soft-remove backup?')) runAction('rollback');
              }}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-amber-700/60 text-xs text-amber-200 hover:border-amber-500"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Rollback
            </button>
            <button
              onClick={reload}
              disabled={loading || !!busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100 flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{message}</div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {loading && summary == null ? '—' : Number(s.value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            Estimated storage recoverable:{' '}
            <span className="text-cyan-300 font-medium">
              {formatBytes(summary?.estimatedStorageRecoverableBytes)}
            </span>
            <span className="text-slate-500 mx-2">·</span>
            Already suppressed:{' '}
            <span className="text-slate-200">
              {summary?.suppression?.suppressedCount?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {reports
              .filter((r) => r.exists)
              .slice(0, 8)
              .map((r) => (
                <button
                  key={r.name}
                  onClick={() => exportFile(r.name)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 text-[11px] text-slate-300 hover:border-cyan-500/50"
                >
                  <Download className="w-3 h-3" />
                  {r.name}
                </button>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, author, ISBN, ID"
                className="pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs w-56"
              />
            </div>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All confidence</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All status</option>
              <option value="open">open</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="merged">merged</option>
            </select>
            <label className="inline-flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={autoOnly}
                onChange={(e) => setAutoOnly(e.target.checked)}
              />
              Auto-eligible only
            </label>
            <div className="text-xs text-slate-500 ml-auto">{total.toLocaleString()} groups</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Canonical</th>
                  <th className="px-3 py-2 font-medium">Confidence</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Members</th>
                  <th className="px-3 py-2 font-medium">Recoverable</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const canon = g.members?.find((m) => m.is_canonical) || g.members?.[0];
                  return (
                    <tr key={g.group_id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-slate-100 line-clamp-2 max-w-[240px]">
                          {canon?.title || `Catalog #${g.canonical_catalog_num}`}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          #{g.canonical_catalog_num}
                          {canon?.author ? ` · ${canon.author}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={
                            g.confidence === 'HIGH'
                              ? 'text-emerald-300'
                              : g.confidence === 'MEDIUM'
                                ? 'text-amber-300'
                                : 'text-slate-400'
                          }
                        >
                          {g.confidence}
                        </span>
                        {g.auto_eligible ? (
                          <div className="text-[10px] text-cyan-400 mt-0.5">auto-eligible</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-300">{g.reason}</td>
                      <td className="px-3 py-2 align-top tabular-nums">{g.member_count}</td>
                      <td className="px-3 py-2 align-top tabular-nums">
                        {formatBytes(g.estimated_recoverable_bytes)}
                      </td>
                      <td className="px-3 py-2 align-top">{g.status}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setSelected(g)}
                            className="px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
                          >
                            Compare
                          </button>
                          <button
                            onClick={() => runAction('approve', { groupId: g.group_id })}
                            className="px-2 py-1 rounded border border-emerald-800/70 text-emerald-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => runAction('reject', { groupId: g.group_id })}
                            className="px-2 py-1 rounded border border-rose-800/70 text-rose-300"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && groups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No duplicate groups yet. Run a dry-run scan to populate candidates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[85vh] overflow-auto rounded-xl border border-slate-700 bg-[#0f1520] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Compare duplicate group</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selected.confidence} · {selected.reason} · canonical #{selected.canonical_catalog_num}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs px-2 py-1 rounded border border-slate-700"
                >
                  Close
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {selected.members.map((m) => (
                  <div
                    key={`${selected.group_id}-${m.catalog_num}`}
                    className={`rounded-lg border p-3 ${
                      m.is_canonical ? 'border-cyan-600/60 bg-cyan-950/20' : 'border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    {m.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.cover_url}
                        alt=""
                        className="w-16 h-24 object-cover rounded mb-2 border border-slate-700"
                      />
                    ) : null}
                    <div className="text-sm font-medium">{m.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-400 mt-1">{m.author}</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                      <div>ID: {m.catalog_num}{m.is_canonical ? ' (canonical)' : ''}</div>
                      <div>Edition: {m.edition || '—'}</div>
                      <div>Volume: {m.volume || '—'}</div>
                      <div>ISBN: {m.isbn13 || '—'}</div>
                      <div>File: {m.file_name || '—'}</div>
                      <div>Size: {formatBytes(m.size_bytes)}</div>
                      <div className="break-all">SHA: {m.sha256 || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
