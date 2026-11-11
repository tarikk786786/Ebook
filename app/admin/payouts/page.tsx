'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Banknote, AlertCircle, Check, X } from 'lucide-react';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

type Row = {
  payoutRequestId: string;
  contributorEmail: string;
  contributorName: string | null;
  amountInr: number;
  status: string;
  upiId: string;
  adminNotes: string | null;
  createdAt: string;
  adminRef: string | null;
};

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [payRefById, setPayRefById] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/payouts?${params}`, {
        headers: { 'x-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setSummary(json.summary || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const postAction = async (body: Record<string, unknown>) => {
    setActionMsg(null);
    const res = await fetch('/api/admin/payouts', {
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
    setActionMsg(json.result?.message || 'Done');
    await load();
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <header className="border-b border-slate-800 bg-[#121826]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Banknote className="w-5 h-5 text-emerald-400" />
            <PayoutPageHeading />
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <p className="text-xs text-slate-400">
          Manual UPI only — enter bank/UPI reference after you transfer. No FamGateway payout API.
        </p>

        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
          {Object.entries(summary).map(([k, v]) => (
            <span key={k} className="px-2 py-1 rounded border border-slate-700 text-slate-300">
              {k}: {v}
            </span>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs"
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="paid">paid</option>
          <option value="rejected">rejected</option>
        </select>

        {error ? (
          <div className="flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : null}
        {actionMsg ? <p className="text-xs text-emerald-400">{actionMsg}</p> : null}

        <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Contributor</th>
                <th className="p-3">Amount</th>
                <th className="p-3">UPI</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No payout requests in this filter.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.payoutRequestId} className="hover:bg-slate-900/40">
                    <td className="p-3">
                      <p className="text-white">{row.contributorEmail}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{row.payoutRequestId.slice(0, 8)}…</p>
                    </td>
                    <td className="p-3 font-mono text-emerald-300">₹{row.amountInr.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">{row.upiId}</td>
                    <td className="p-3 uppercase font-mono text-[10px]">{row.status}</td>
                    <td className="p-3">
                      {row.status === 'paid' ? (
                        <span className="font-mono text-[10px] text-slate-400">{row.adminRef ?? '—'}</span>
                      ) : (
                        <PayoutRowActions
                          row={row}
                          payRef={payRefById[row.payoutRequestId] ?? ''}
                          notes={notesById[row.payoutRequestId] ?? ''}
                          onPayRefChange={(v: string) =>
                            setPayRefById((prev) => ({ ...prev, [row.payoutRequestId]: v }))
                          }
                          onNotesChange={(v: string) =>
                            setNotesById((prev) => ({ ...prev, [row.payoutRequestId]: v }))
                          }
                          onApprove={() =>
                            postAction({
                              action: 'approve',
                              payoutRequestId: row.payoutRequestId,
                              adminNotes: notesById[row.payoutRequestId],
                            })
                          }
                          onReject={() =>
                            postAction({
                              action: 'reject',
                              payoutRequestId: row.payoutRequestId,
                              adminNotes: notesById[row.payoutRequestId],
                            })
                          }
                          onMarkPaid={() =>
                            postAction({
                              action: 'mark_paid',
                              payoutRequestId: row.payoutRequestId,
                              adminRef: payRefById[row.payoutRequestId] ?? '',
                            })
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function PayoutPageHeading() {
  return (
    <div>
      <h1 className="font-bold text-white">Community payouts</h1>
      <p className="text-[11px] text-slate-400">Approve, reject, or mark paid with reference ID</p>
    </div>
  );
}

function PayoutRowActions({
  row,
  payRef,
  notes,
  onPayRefChange,
  onNotesChange,
  onApprove,
  onReject,
  onMarkPaid,
}: {
  row: Row;
  payRef: string;
  notes: string;
  onPayRefChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPaid: () => void;
}) {
  return (
    <div className="flex flex-col items-end gap-2 min-w-[220px]">
      <input
        type="text"
        placeholder="Admin notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px]"
      />
      <input
        type="text"
        placeholder="UPI ref / txn ID (required to pay)"
        value={payRef}
        onChange={(e) => onPayRefChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono"
      />
      <div className="flex gap-1">
        {row.status === 'pending' ? (
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-900/50 border border-sky-700 text-sky-200 text-[10px]"
          >
            <Check className="w-3 h-3" /> Approve
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-900/40 border border-rose-800 text-rose-200 text-[10px]"
        >
          <X className="w-3 h-3" /> Reject
        </button>
        <button
          type="button"
          disabled={payRef.trim().length < 4}
          onClick={onMarkPaid}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-700 text-slate-950 text-[10px] font-semibold disabled:opacity-40"
        >
          Mark paid
        </button>
      </div>
    </div>
  );
}
