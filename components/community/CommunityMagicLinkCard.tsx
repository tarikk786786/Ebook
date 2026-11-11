'use client';

import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

type SessionRole = 'contributor' | 'requester';

type CommunityMagicLinkCardProps = {
  role: SessionRole;
  title?: string;
  description?: string;
  onSuccess?: () => void;
};

export default function CommunityMagicLinkCard({
  role,
  title = 'Sign in with email',
  description = 'We send a one-time secure link. No password required.',
  onSuccess,
}: CommunityMagicLinkCardProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/community/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          displayName: name.trim() || undefined,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
        onSuccess?.();
      } else if (res.status === 404 || res.status === 501) {
        setError('Sign-in API is not live yet. Your email is not stored—try again after deployment.');
      } else {
        setError(typeof data.error === 'string' ? data.error : 'Could not send magic link.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-book space-y-3 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#9A704B] mx-auto" />
        <h3 className="font-serif text-lg font-semibold text-[#24231F]">Check your inbox</h3>
        <p className="text-xs text-[#6E685F] leading-relaxed">
          If an account exists for <strong className="text-[#24231F]">{email}</strong>, you will receive a
          sign-in link within a few minutes. Links expire in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 shadow-book space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold text-[#24231F]">{title}</h3>
        <p className="text-xs text-[#6E685F]">{description}</p>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {role === 'contributor' && (
          <div>
            <label className="block mb-1 font-medium text-[#24231F]">Display name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-md px-3 py-2 text-[#24231F] focus:outline-none focus:border-[#9A704B]"
              placeholder="How we address you in review emails"
            />
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium text-[#24231F]">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#81796D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-md pl-9 pr-3 py-2 text-[#24231F] focus:outline-none focus:border-[#9A704B]"
              placeholder="you@university.edu"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Send magic link</span>
        </button>
      </form>
    </div>
  );
}
