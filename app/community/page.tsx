'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CommunityShell from '@/components/community/CommunityShell';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { Users, ThumbsUp, Loader2, PlusCircle } from 'lucide-react';

type CommunityRequest = {
  request_id: string;
  title: string;
  author?: string | null;
  status?: string;
  upvote_count?: number;
  created_at?: string;
};

export default function CommunityPage() {
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(true);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/community/requests', { credentials: 'include' });
        if (res.status === 404 || res.status === 501) {
          if (!cancelled) setApiReady(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const list = (data.requests || data.items || []) as CommunityRequest[];
        if (!cancelled) setRequests(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpvote = async (requestId: string) => {
    setUpvotingId(requestId);
    try {
      const res = await fetch(`/api/community/requests/${encodeURIComponent(requestId)}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = data.upvote_count ?? data.upvoteCount;
        setRequests((prev) =>
          prev.map((r) =>
            r.request_id === requestId
              ? { ...r, upvote_count: typeof count === 'number' ? count : (r.upvote_count ?? 0) + 1 }
              : r,
          ),
        );
      }
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <CommunityShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs text-[#81796D] font-medium">
            <Users className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Open community board</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#24231F]">What readers are asking for</h1>
          <p className="text-sm text-[#6E685F] max-w-xl mx-auto">
            Upvote titles you need. Contributors can submit verified editions to fulfill top requests.
          </p>
          <Link
            href="/request-ebook"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#24231F] text-white text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            New request
          </Link>
        </div>

        {!apiReady && <CommunityApiNotice feature="Community board" apiPath="GET /api/community/requests" />}

        <RequestsList
          loading={loading}
          apiReady={apiReady}
          requests={requests}
          upvotingId={upvotingId}
          onUpvote={handleUpvote}
        />
      </div>
    </CommunityShell>
  );
}

function RequestsList({
  loading,
  apiReady,
  requests,
  upvotingId,
  onUpvote,
}: {
  loading: boolean;
  apiReady: boolean;
  requests: CommunityRequest[];
  upvotingId: string | null;
  onUpvote: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-[#81796D]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!apiReady || requests.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-10 text-center shadow-book space-y-3">
        <h2 className="font-serif text-lg font-semibold text-[#24231F]">No open requests yet</h2>
        <p className="text-xs text-[#6E685F] max-w-md mx-auto">
          {apiReady
            ? 'Be the first to ask for a title—students and contributors see the same board.'
            : 'Once the requests API is deployed, this shelf fills automatically from community_marketplace.sqlite.'}
        </p>
        <Link href="/request-ebook" className="text-xs text-[#9A704B] font-semibold underline">
          Submit a request
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((req) => (
        <li
          key={req.request_id}
          className="bg-white border border-[#E8E4DC] rounded-xl p-4 shadow-book flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-serif text-base font-semibold text-[#24231F] truncate">{req.title}</h3>
            {req.author ? <p className="text-xs text-[#6E685F]">{req.author}</p> : null}
            <p className="text-[10px] text-[#81796D] uppercase tracking-wide">
              {req.status || 'open'}
              {req.created_at ? ` · ${new Date(req.created_at).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpvote(req.request_id)}
            disabled={!!upvotingId}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E8E4DC] bg-[#FAF8F5] text-xs font-medium text-[#24231F] hover:border-[#9A704B]/50 disabled:opacity-50 shrink-0"
          >
            {upvotingId === req.request_id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5 text-[#9A704B]" />
            )}
            <span>{req.upvote_count ?? 0}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
