'use client';

import React, { useState } from 'react';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { useContributorSession } from '@/components/community/useContributorSession';
import { Loader2, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';

type PayoutRow = {
  payoutRequestId: string;
  amountInr: number;
  status: string;
  upiId: string;
  createdAt: string;
  paidAt: string | null;
  adminRef: string | null;
};

type EarningsSummary = {
  availableInr?: number;
  pendingPayoutInr?: number;
};

type PayoutRules = {
  minWithdrawalInr?: number;
};

export default function ContributorPayoutsPage() {
  const { loading, authenticated, apiReady, data, error, refresh } = useContributorSession();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const requestPayout = async (amountInr?: number) => {
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const body = amountInr != null && Number.isFinite(amountInr) ? { amountInr } : {};
      const res = await fetch('/api/community/payouts/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(typeof json.error === 'string' ? json.error : 'Payout request failed.');
        return;
      }
      setFormSuccess(`Request submitted for ₹${Number(json.amountInr).toFixed(2)}. Admin will review manually.`);
      setCustomAmount('');
      await refresh();
    } catch {
      setFormError('Connection error while submitting payout request.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <CommunityApiNotice feature="Payout requests" apiPath="POST /api/community/payouts/request" />
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
  const rules = (data?.payoutRules ?? {}) as PayoutRules;
  const payouts = (data?.payouts ?? []) as PayoutRow[];
  const available = earnings.availableInr ?? 0;
  const minWithdrawal = rules.minWithdrawalInr ?? 100;
  const upi = data?.contributor?.upiId ?? data?.contributor?.upi_id;

  const parsedCustom = customAmount.trim() ? Number.parseFloat(customAmount) : NaN;
  const canSubmitCustom =
    !submitting &&
    Number.isFinite(parsedCustom) &&
    parsedCustom >= minWithdrawal &&
    parsedCustom <= available + 0.001;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-book space-y-4">
        <div className="flex items-start gap-3">
          <Banknote className="w-5 h-5 text-[#9A704B] mt-0.5" />
          <div className="space-y-1 text-xs text-[#6E685F]">
            <p className="text-sm font-serif font-semibold text-[#24231F]">Manual UPI payout</p>
            <p>
              After you request a withdrawal, an admin verifies and sends UPI from our business account. No
              automatic gateway payout — you will receive funds only after manual confirmation.
            </p>
            <p>
              Minimum withdrawal: <strong className="text-[#24231F]">₹{minWithdrawal.toFixed(2)}</strong>
              {' · '}
              Available: <strong className="text-[#24231F]">₹{available.toFixed(2)}</strong>
            </p>
            {upi ? (
              <p>
                Payout UPI: <span className="font-mono text-[#24231F]">{upi}</span>
              </p>
            ) : (
              <p className="text-rose-700">Add your UPI ID on the affiliate/submit flow before requesting payout.</p>
            )}
          </div>
        </div>

        {formError ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {formError}
          </div>
        ) : null}
        {formSuccess ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {formSuccess}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-[#81796D]">Custom amount (optional)</label>
            <input
              type="number"
              min={minWithdrawal}
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Up to ₹${available.toFixed(2)}`}
              className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] text-sm text-[#24231F] focus:outline-none focus:border-[#9A704B]/60"
            />
          </div>
          <button
            type="button"
            disabled={!canSubmitCustom}
            onClick={() => void requestPayout(parsedCustom)}
            className="px-4 py-2 rounded-lg bg-[#24231F] text-white text-xs font-semibold disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Request custom amount'}
          </button>
          <button
            type="button"
            disabled={submitting || available < minWithdrawal || !upi}
            onClick={() => void requestPayout()}
            className="px-4 py-2 rounded-lg border border-[#24231F] text-[#24231F] text-xs font-semibold disabled:opacity-40"
          >
            Withdraw all available
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E8E4DC] rounded-xl shadow-book overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E4DC]">
          <h2 className="font-serif text-lg font-semibold text-[#24231F]">Your payout requests</h2>
        </div>
        {payouts.length === 0 ? (
          <p className="p-8 text-center text-xs text-[#6E685F]">No payout requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#6E685F] uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2">Requested</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DC]">
                {payouts.map((p) => (
                  <tr key={p.payoutRequestId}>
                    <td className="px-4 py-2.5 text-[#6E685F]">{formatWhen(p.createdAt)}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#24231F]">₹{p.amountInr.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-[#6E685F]">
                      {p.adminRef ?? (p.status === 'paid' ? '—' : 'Pending transfer')}
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

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    approved: 'bg-sky-50 text-sky-800 border-sky-200',
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase ${
        tones[status] ?? 'bg-[#FAF8F5] text-[#6E685F] border-[#E8E4DC]'
      }`}
    >
      {status}
    </span>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
