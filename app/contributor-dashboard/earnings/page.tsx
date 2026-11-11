'use client';

import React from 'react';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { useContributorSession } from '@/components/community/useContributorSession';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

type EarningRow = {
  earningId: string;
  entryType: string;
  amountInr: number;
  orderId: string | null;
  bookId: string | null;
  reason: string | null;
  createdAt: string;
};

type EarningsSummary = {
  lifetimeNetInr?: number;
  balanceInr?: number;
  creditsTotalInr?: number;
  debitsTotalInr?: number;
  pendingPayoutInr?: number;
  availableInr?: number;
  ledgerReady?: boolean;
};

export default function ContributorEarningsPage() {
  const { loading, authenticated, apiReady, data, error, refresh } = useContributorSession();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#81796D]" />
      </div>
    );
  }

  if (!apiReady) {
    return (
      <div className="space-y-6">
        <CommunityApiNotice feature="Earnings ledger" apiPath="GET /api/community/contributor/me" />
        <CommunityMagicLinkCard role="contributor" onSuccess={() => void refresh()} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="space-y-6">
        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">{error}</div>
        ) : null}
        <CommunityMagicLinkCard role="contributor" onSuccess={() => void refresh()} />
      </div>
    );
  }

  const earnings = (data?.earnings ?? {}) as EarningsSummary;
  const rows = (data?.recentEarnings ?? []) as EarningRow[];
  const lifetime = earnings.lifetimeNetInr ?? earnings.balanceInr ?? 0;
  const available = earnings.availableInr ?? 0;
  const pending = earnings.pendingPayoutInr ?? 0;
  const credits = earnings.creditsTotalInr ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <BalanceCard label="Lifetime (net)" value={lifetime} helper="Credits minus debits on ledger" />
        <BalanceCard label="Available" value={available} helper="After pending payout holds" highlight />
        <BalanceCard label="Pending payout" value={pending} helper="Awaiting admin UPI transfer" />
      </div>

      <div className="bg-white border border-[#E8E4DC] rounded-xl shadow-book overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E4DC] flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#24231F]">Recent credits & debits</h2>
          <span className="text-[10px] text-[#6E685F] uppercase tracking-wide">
            Gross credits ₹{credits.toFixed(2)}
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-[#6E685F]">
            No ledger activity yet. Earnings appear after paid orders on your published listings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#6E685F] uppercase text-[10px] tracking-wide">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DC]">
                {rows.map((row) => (
                  <tr key={row.earningId} className="hover:bg-[#FAF8F5]/80">
                    <td className="px-4 py-2.5 text-[#6E685F] whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[#24231F]">
                        {row.entryType === 'credit' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        {row.entryType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-[#6E685F]">{row.reason ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] truncate max-w-[120px]">
                      {row.orderId ?? '—'}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold ${
                        row.entryType === 'credit' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {row.entryType === 'credit' ? '+' : '−'}₹{row.amountInr.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: number;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${
        highlight ? 'border-[#9A704B]/50 bg-[#FFFDF9]' : 'border-[#E8E4DC] bg-white'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-[#81796D]">{label}</p>
      <p className="font-serif text-2xl font-bold text-[#24231F]">₹{value.toFixed(2)}</p>
      <p className="text-[10px] text-[#6E685F]">{helper}</p>
    </div>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
