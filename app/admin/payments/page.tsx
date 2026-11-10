'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Download,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

type Summary = {
  totalOrders: number;
  successfulPayments: number;
  pendingPayments: number;
  failedTransactions: number;
  expiredPayments: number;
  refunds: number;
  totalConfirmedRevenueInr: number;
  gateway: string;
  famGatewayConfigured: boolean;
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

export default function AdminPaymentsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [daily, setDaily] = useState<Array<{ day: string; count: number; revenue: number }>>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/payments?${params}`, {
        headers: { 'x-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSummary(json.summary);
      setOrders(json.orders || []);
      setDaily(json.dailyActivity || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (orderId: string) => {
    setVerifyResult(null);
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getAdminToken(),
      },
      body: JSON.stringify({ action: 'verify', orderId }),
    });
    const json = await res.json();
    setVerifyResult(json);
  };

  const exportCsv = async () => {
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getAdminToken(),
      },
      body: JSON.stringify({ action: 'export' }),
    });
    if (!res.ok) {
      setError('Export failed');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'famgateway_payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: 'Total orders', value: summary?.totalOrders },
    { label: 'Successful', value: summary?.successfulPayments },
    { label: 'Pending', value: summary?.pendingPayments },
    { label: 'Failed', value: summary?.failedTransactions },
    { label: 'Expired', value: summary?.expiredPayments },
    { label: 'Refunds', value: summary?.refunds },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
              FamGateway Payments
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live orders from `orders_store.json`. Credentials stay server-side.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400 flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Gateway: {summary?.gateway || 'FAMGATEWAY'}
          </span>
          <span>API key configured: {summary?.famGatewayConfigured ? 'yes' : 'no'}</span>
          <span className="text-emerald-300 font-medium">
            Confirmed revenue: ₹{(summary?.totalConfirmedRevenueInr || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{c.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {loading && !summary ? '—' : Number(c.value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-sm font-medium mb-3">Daily payment activity</div>
          <div className="space-y-1 max-h-48 overflow-auto text-xs">
            {daily.length === 0 && <div className="text-slate-500">No successful payments yet.</div>}
            {daily.map((d) => (
              <div key={d.day} className="flex justify-between border-b border-slate-800/80 py-1.5">
                <span className="text-slate-400">{d.day}</span>
                <span>
                  {d.count} · ₹{d.revenue.toLocaleString('en-IN')}
                </span>
              </div>
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
                placeholder="Search order, email, UTR…"
                className="pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs w-56"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">UTR</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId} className="border-t border-slate-800/80">
                    <td className="px-3 py-2 font-mono">
                      <div>{o.orderNumber || o.orderId}</div>
                      <div className="text-slate-500">{o.titles?.[0]}</div>
                    </td>
                    <td className="px-3 py-2">{o.status}</td>
                    <td className="px-3 py-2">₹{Number(o.totalInr || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{o.customerEmail}</td>
                    <td className="px-3 py-2 font-mono">{o.bankUtr || '—'}</td>
                    <td className="px-3 py-2">{o.createdAt?.slice(0, 19)?.replace('T', ' ')}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => verify(o.gatewayOrderId || o.orderId)}
                        className="px-2 py-1 rounded border border-slate-700 hover:border-cyan-500/50"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {verifyResult && (
          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] overflow-auto max-h-72 text-slate-300">
            {JSON.stringify(verifyResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
