'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CommunityShell from '@/components/community/CommunityShell';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { BookMarked, Loader2, ArrowRight, ThumbsUp } from 'lucide-react';

export default function RequestEbookPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequestId(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required so we can notify you.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/community/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          isbn13: isbn13.trim() || undefined,
          notes: notes.trim() || undefined,
          requesterEmail: email.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404 || res.status === 501) {
        setError('Request API is not live yet—your form is ready; retry after deployment.');
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save request.');
        return;
      }
      setRequestId(data.requestId || data.request_id || 'queued');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommunityShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs text-[#81796D] font-medium">
            <BookMarked className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Community Wishlist</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#24231F]">
            Request a missing title
          </h1>
          <p className="text-sm text-[#6E685F] leading-relaxed">
            Tell us what you need for coursework or self-study. Open requests appear on the community board for
            upvotes—contributors can fulfill popular asks.
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-xs text-[#9A704B] font-semibold hover:underline"
          >
            Browse open requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CommunityApiNotice feature="Title request" apiPath="POST /api/community/requests" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white border border-[#E8E4DC] rounded-xl p-6 sm:p-8 shadow-book space-y-4 text-xs"
          >
            <h2 className="font-serif text-xl font-bold text-[#24231F]">Request details</h2>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{error}</div>
            )}
            {requestId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">
                Request queued (ref <span className="font-mono">{requestId}</span>). See it on the{' '}
                <Link href="/community" className="underline text-[#9A704B] font-semibold">
                  community board
                </Link>
                .
              </div>
            )}

            <div>
              <label className="block mb-1 font-medium">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Author</label>
                <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block mb-1 font-medium">ISBN-13</label>
                <input value={isbn13} onChange={(e) => setIsbn13(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">Your email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Context (edition, course, urgency)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} min-h-[96px]`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-semibold disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookMarked className="w-4 h-4" />}
              <span>Post request</span>
            </button>
          </form>

          <aside className="space-y-4">
            <CommunityMagicLinkCard
              role="requester"
              title="Optional: requester sign-in"
              description="Use the same email to manage upvotes and notifications later."
            />
            <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book text-xs text-[#6E685F] space-y-2">
              <div className="flex items-center gap-2 text-[#24231F] font-serif font-semibold text-sm">
                <ThumbsUp className="w-4 h-4 text-[#9A704B]" />
                Upvote popular asks
              </div>
              <p>
                After APIs land, anyone can upvote via <code className="font-mono text-[10px]">POST /api/community/requests/:id/upvote</code>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </CommunityShell>
  );
}

const inputClass =
  'w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-md px-3 py-2 text-[#24231F] focus:outline-none focus:border-[#9A704B]';
