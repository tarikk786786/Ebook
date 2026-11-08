'use client';

import React, { useState } from 'react';
import { Mail, Check, ArrowRight, ShieldCheck, Download, BookOpen } from 'lucide-react';
import { trackLead } from '@/lib/analytics';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please acknowledge reading consent to receive emails.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source: 'homepage_section' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        trackLead(email, 'homepage_section');
      } else {
        setError(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white border-y border-[#E8E4DC] py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-2xl p-8 sm:p-12 shadow-book">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs font-medium text-[#81796D]">
              <Mail className="w-3.5 h-3.5 text-[#9A704B]" />
              <span>AnonTrove Reader Dispatch</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
              Curated Releases & Technical Study Primers
            </h2>

            <p className="text-xs sm:text-sm text-[#6E685F] leading-relaxed">
              Subscribe to receive weekly book spotlights, editorial notes, and an instant complimentary copy of our <em>Software Engineering Principles & System Architecture Primer</em> (PDF).
            </p>

            {!success ? (
              <form onSubmit={handleSubscribe} className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full bg-white border border-[#E8E4DC] rounded-lg px-4 py-2.5 text-xs text-[#24231F] placeholder-[#81796D] focus:outline-none focus:border-[#9A704B] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-5 bg-[#24231F] hover:bg-[#3D3B35] disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{loading ? 'Subscribing...' : 'Get Free Primer'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-[#81796D]">
                  <input
                    type="checkbox"
                    id="newsletter-consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="rounded border-[#E8E4DC] text-[#24231F] focus:ring-0"
                  />
                  <label htmlFor="newsletter-consent" className="cursor-pointer">
                    I agree to receive book releases and study materials. Unsubscribe anytime.
                  </label>
                </div>

                {error && (
                  <p className="text-xs text-rose-600 font-medium">{error}</p>
                )}
              </form>
            ) : (
              <div className="p-6 bg-white border border-[#E8E4DC] rounded-xl space-y-3 mt-4 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#24231F]">You're Subscribed!</h3>
                <p className="text-xs text-[#6E685F]">
                  Welcome to AnonTrove. Your primer <em>"Software Engineering Principles"</em> has been emailed, or you can access it immediately.
                </p>
                <div className="pt-2">
                  <a
                    href="/library"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#24231F] text-white rounded-lg text-xs font-semibold hover:bg-[#3D3B35] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open in Digital Library</span>
                  </a>
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-center gap-4 text-[11px] text-[#81796D]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9A704B]" /> Zero Spam Guarantee
              </span>
              <span>•</span>
              <span>100% DRM-Free PDF</span>
              <span>•</span>
              <span>One-Click Unsubscribe</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
