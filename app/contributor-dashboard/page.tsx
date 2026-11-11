'use client';

import React from 'react';
import Link from 'next/link';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { useContributorSession } from '@/components/community/useContributorSession';
import { FileText, Wallet, Banknote, Loader2, ArrowRight } from 'lucide-react';

export default function ContributorDashboardOverviewPage() {
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
        <CommunityApiNotice feature="Contributor dashboard" apiPath="GET /api/community/contributor/me" />
        <CommunityMagicLinkCard role="contributor" onSuccess={() => void refresh()} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="space-y-6">
        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">{error}</div>
        ) : (
          <p className="text-xs text-[#6E685F]">Sign in to see balances and submission status.</p>
        )}
        <CommunityMagicLinkCard role="contributor" onSuccess={() => void refresh()} />
      </div>
    );
  }

  const earnings = (data?.earnings ?? {}) as {
    availableInr?: number;
    balanceInr?: number;
    pendingPayoutInr?: number;
  };
  const balance = earnings.availableInr ?? earnings.balanceInr ?? 0;
  const pending = earnings.pendingPayoutInr ?? 0;
  const email = data?.contributor?.email ?? 'contributor';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-book space-y-4">
        <p className="text-xs text-[#6E685F]">
          Signed in as <strong className="text-[#24231F]">{email}</strong>
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard icon={Wallet} label="Available balance" value={`₹${balance.toFixed(2)}`} />
          <StatCard icon={Banknote} label="Pending payout" value={`₹${pending.toFixed(2)}`} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-xs">
        <QuickLink href="/contributor-dashboard/submissions" icon={FileText} label="Submissions" />
        <QuickLink href="/contributor-dashboard/earnings" icon={Wallet} label="Earnings ledger" />
        <QuickLink href="/contributor-dashboard/payouts" icon={Banknote} label="Request payout" />
      </div>

      <Link
        href="/submit-ebook"
        className="inline-flex items-center gap-2 text-xs text-[#9A704B] font-semibold hover:underline"
      >
        Submit another ebook <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F5] p-4 space-y-1">
      <div className="flex items-center gap-2 text-[#81796D]">
        <Icon className="w-4 h-4 text-[#9A704B]" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-serif text-xl font-bold text-[#24231F]">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-4 rounded-xl bg-white border border-[#E8E4DC] hover:border-[#9A704B]/40 shadow-book transition-colors"
    >
      <Icon className="w-4 h-4 text-[#9A704B]" />
      <span className="font-medium text-[#24231F]">{label}</span>
    </Link>
  );
}
