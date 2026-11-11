'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Check,
  X,
  Upload,
} from 'lucide-react';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

type Row = {
  submissionId: string;
  title: string;
  author: string | null;
  status: string;
  contributorEmail: string;
  licenseStatus: string | null;
  commercialOk: boolean;
  suggestedPriceInr: number | null;
  submittedAt: string | null;
};

export default function AdminContributionsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [licenseStatus, setLicenseStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [licenseTarget, setLicenseTarget] = useState<string | null>(null);
  const [licenseForm, setLicenseForm] = useState({
    status: 'pending',
    commercialOk: false,
    platform: '',
    evidenceUrl: '',
    reviewerNotes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      if (licenseStatus) params.set('licenseStatus', licenseStatus);
      const res = await fetch(`/api/admin/contributions?${params}`, {
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
  }, [q, status, licenseStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const postAction = async (body: Record<string, unknown>) => {
    setActionMsg(null);
    const res = await fetch('/api/admin/contributions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getAdminToken(),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setActionMsg(json.error || json.result?.error || 'Action failed');
      return;
    }
    setActionMsg(json.result?.message || `Done: ${body.action}`);
    setLicenseTarget(null);
    await load();
  };

  const statusBadge = (s: string) => {
    const tones: Record<string, string> = {
      submitted: 'text-sky-300 border-sky-800',
      under_review: 'text-amber-300 border-amber-800',
      license_pending: 'text-orange-300 border-orange-800',
      approved: 'text-emerald-300 border-emerald-800',
      rejected: 'text-rose-300 border-rose-800',
      published: 'text-violet-300 border-violet-800',
    };
    const cls = tones[s] || 'text-slate-300 border-slate-700';
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase ${cls}`}>{s}</span>
    );
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
              <BookOpen className="w-6 h-6 text-cyan-400" />
              Community Contributions
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review submissions, verify licenses, publish only after license = verified.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/admin/requests"
              className="px-3 py-2 rounded-lg border border-slate-700 text-xs hover:border-cyan-500/40"
            >
              Requests queue
            </Link>
            <Link
              href="/admin/settings"
              className="px-3 py-2 rounded-lg border border-slate-700 text-xs hover:border-cyan-500/40"
            >
              Platform settings
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {(error || actionMsg) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm flex gap-2 ${
              error ? 'border-rose-800/60 bg-rose-950/40' : 'border-emerald-800/60 bg-emerald-950/30'
            }`}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error || actionMsg}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400 flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> {total} in queue
          </span>
          {Object.entries(summary).map(([k, v]) => (
            <span key={k} className="font-mono">
              {k}: {v}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, author, contributor email…"
                className="pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs w-64"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All submission statuses</option>
              <option value="submitted">submitted</option>
              <option value="under_review">under_review</option>
              <option value="license_pending">license_pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="published">published</option>
            </select>
            <select
              value={licenseStatus}
              onChange={(e) => setLicenseStatus(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All license statuses</option>
              <option value="pending">pending</option>
              <option value="needs_review">needs_review</option>
              <option value="verified">verified</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Contributor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">License</th>
                  <th className="px-3 py-2">List ₹</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.submissionId} className="border-t border-slate-800/80">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-100">{row.title}</div>
                      <div className="text-slate-500">{row.author || '—'}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{row.contributorEmail}</td>
                    <td className="px-3 py-2">{statusBadge(row.status)}</td>
                    <td className="px-3 py-2 font-mono">{row.licenseStatus || '—'}</td>
                    <td className="px-3 py-2">{row.suggestedPriceInr != null ? `₹${row.suggestedPriceInr}` : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() =>
                            postAction({ action: 'approve', submissionId: row.submissionId })
                          }
                          className="px-2 py-1 rounded border border-emerald-800 text-emerald-300 hover:bg-emerald-950/40 inline-flex items-center gap-1"
                          title="Approve (requires license verified for full approve)"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            postAction({ action: 'reject', submissionId: row.submissionId })
                          }
                          className="px-2 py-1 rounded border border-rose-800 text-rose-300 hover:bg-rose-950/40 inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                        <button
                          onClick={() => {
                            setLicenseTarget(row.submissionId);
                            setLicenseForm({
                              status: row.licenseStatus || 'pending',
                              commercialOk: row.commercialOk,
                              platform: '',
                              evidenceUrl: '',
                              reviewerNotes: '',
                            });
                          }}
                          className="px-2 py-1 rounded border border-slate-700 hover:border-cyan-500/40"
                        >
                          License
                        </button>
                        <button
                          onClick={() =>
                            postAction({
                              action: 'publish',
                              submissionId: row.submissionId,
                            })
                          }
                          className="px-2 py-1 rounded border border-violet-800 text-violet-300 hover:bg-violet-950/40 inline-flex items-center gap-1"
                          title="Blocked unless license verified + approved"
                        >
                          <Upload className="w-3 h-3" /> Publish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                      No contributor submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {licenseTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#121826] p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-white">License verification</h3>
            <p className="text-slate-400 font-mono">{licenseTarget}</p>
            <select
              value={licenseForm.status}
              onChange={(e) => setLicenseForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"
            >
              <option value="pending">pending</option>
              <option value="needs_review">needs_review</option>
              <option value="verified">verified</option>
              <option value="rejected">rejected</option>
            </select>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={licenseForm.commercialOk}
                onChange={(e) => setLicenseForm((f) => ({ ...f, commercialOk: e.target.checked }))}
              />
              Commercial use OK
            </label>
            <input
              placeholder="Platform (e.g. Leanpub)"
              value={licenseForm.platform}
              onChange={(e) => setLicenseForm((f) => ({ ...f, platform: e.target.value }))}
              className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"
            />
            <input
              placeholder="Evidence URL"
              value={licenseForm.evidenceUrl}
              onChange={(e) => setLicenseForm((f) => ({ ...f, evidenceUrl: e.target.value }))}
              className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700"
            />
            <textarea
              placeholder="Reviewer notes"
              value={licenseForm.reviewerNotes}
              onChange={(e) => setLicenseForm((f) => ({ ...f, reviewerNotes: e.target.value }))}
              className="w-full px-2 py-2 rounded bg-slate-900 border border-slate-700 min-h-[72px]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setLicenseTarget(null)}
                className="px-3 py-1.5 rounded border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  postAction({
                    action: 'update_license',
                    submissionId: licenseTarget,
                    status: licenseForm.status,
                    commercialOk: licenseForm.commercialOk,
                    platform: licenseForm.platform || undefined,
                    evidenceUrl: licenseForm.evidenceUrl,
                    reviewerNotes: licenseForm.reviewerNotes || undefined,
                  })
                }
                className="px-3 py-1.5 rounded bg-cyan-600 text-slate-950 font-semibold"
              >
                Save license
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
