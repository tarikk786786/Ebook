'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { useContributorSession } from '@/components/community/useContributorSession';
import { Loader2, FileText } from 'lucide-react';

type SubmissionRow = {
  submission_id: string;
  title: string;
  status?: string;
  suggested_price_inr?: number | null;
  updated_at?: string;
};

export default function ContributorSubmissionsPage() {
  const { loading, authenticated, apiReady, refresh } = useContributorSession();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !apiReady) return;
    let cancelled = false;
    setListLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/community/submissions', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const list = (data.submissions || data.items || []) as SubmissionRow[];
        if (!cancelled) setSubmissions(list);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, apiReady]);

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
        <CommunityApiNotice feature="Submissions list" apiPath="GET /api/community/submissions" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="space-y-6">
        <CommunityMagicLinkCard role="contributor" onSuccess={() => void refresh()} />
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#81796D]" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-10 text-center shadow-book space-y-3">
        <FileText className="w-8 h-8 text-[#9A704B] mx-auto" />
        <h2 className="font-serif text-lg font-semibold text-[#24231F]">No submissions yet</h2>
        <p className="text-xs text-[#6E685F]">Start with metadata on the submit flow—files attach when storage API ships.</p>
        <Link href="/submit-ebook" className="text-xs text-[#9A704B] font-semibold underline">
          Submit an ebook
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3 text-xs">
      {submissions.map((s) => (
        <li
          key={s.submission_id}
          className="bg-white border border-[#E8E4DC] rounded-xl p-4 shadow-book flex flex-wrap items-center justify-between gap-2"
        >
          <div>
            <p className="font-serif text-sm font-semibold text-[#24231F]">{s.title}</p>
            <p className="text-[10px] text-[#81796D] uppercase tracking-wide mt-1">
              {s.status || 'draft'}
              {s.suggested_price_inr ? ` · ₹${s.suggested_price_inr}` : ''}
            </p>
          </div>
          <span className="font-mono text-[10px] text-[#6E685F]">{s.submission_id.slice(0, 8)}…</span>
        </li>
      ))}
    </ul>
  );
}
