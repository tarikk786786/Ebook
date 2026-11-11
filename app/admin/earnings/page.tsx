'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Wallet, AlertCircle } from 'lucide-react';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

type Row = {
  earningId: string;
  contributorEmail: string;
  entryType: string;
  amountInr: number;
  orderId: string | null;
  bookId: string | null;
  reason: string | null;
  createdAt: string;
};

export default function AdminEarningsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [totals, setTotals] = useState({ creditsInr: 0, debitsInr: 0 });
  const [entryType, setEntryType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (entryType) params.set('entryType', entryType);
      const res = await fetch(`/api/admin/earnings?${params}`, {
        headers: { 'x-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      setTotals(json.totals || { creditsInr: 0, debitsInr: 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [entryType]);

  useEffect(() => {
    load();
  }, [load]);

  const net = totals.creditsInr - totals.debitsInr;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <header className="border-b border-slate-800 bg-[#121826]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Wallet className="w-5 h-5 text-amber-400" />
            <div>
              <h1 className="font-bold text-white">Community earnings ledger</h1>
              <p className="text-[11px] text-slate-400">Immutable credits/debits from paid orders & payouts</p>
            </div>
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
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <Stat label="Credits" value={totals.creditsInr} tone="text-emerald-400" />
          <Stat label="Debits" value={totals.debitsInr} tone="text-rose-400" />
          <Stat label="Net (filtered)" value={net} tone="text-white" />
        </div>

        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs"
        >
          <option value="">All entry types</option>
          <option value="credit">credit</option>
          <option value="debit">debit</option>
        </select>

        {error ? (
          <div className="flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : null}

        <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Contributor</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Order</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No ledger rows yet.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.earningId} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{row.createdAt}</td>
                    <td className="p-3 text-white">{row.contributorEmail}</td>
                    <td className="p-3 font-mono uppercase text-[10px]">{row.entryType}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{row.reason ?? '—'}</td>
                    <td className="p-3 font-mono text-[10px] truncate max-w-[100px]">{row.orderId ?? '—'}</td>
                    <td
                      className={`p-3 text-right font-mono ${
                        row.entryType === 'credit' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      ₹{row.amountInr.toFixed(2)}
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

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-4">
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className={`text-lg font-mono font-bold ${tone}`}>₹{value.toFixed(2)}</p>
    </div>
  );
}
