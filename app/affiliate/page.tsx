'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Share2, Check, ArrowRight, ShieldCheck, DollarSign, Award, Users } from 'lucide-react';

export default function AffiliatePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, upiId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData(data.affiliate);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (successData?.referralLink) {
      navigator.clipboard.writeText(successData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-12">
        {/* Editorial Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs text-[#81796D] font-medium">
            <Award className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Partner Program</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#24231F]">
            Share Knowledge. Earn 20% Direct Commission.
          </h1>
          <p className="text-sm text-[#6E685F] leading-relaxed">
            Join the AnonTrove Partner Program. Recommend over 12,192+ verified DRM-free digital books and software manuals to your students, followers, or colleagues. Payouts processed directly via UPI.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2 shadow-book">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-base font-semibold text-[#24231F]">20% Flat Commission</h2>
            <p className="text-xs text-[#6E685F] leading-relaxed">
              Earn 20% on every single purchase made through your link with 30-day cookie attribution.
            </p>
          </div>

          <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2 shadow-book">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-base font-semibold text-[#24231F]">Direct UPI Payouts</h2>
            <p className="text-xs text-[#6E685F] leading-relaxed">
              No complex overseas banking or withdrawal delays. Receive earnings straight to your UPI ID every month.
            </p>
          </div>

          <div className="bg-white border border-[#E8E4DC] rounded-xl p-6 space-y-2 shadow-book">
            <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#9A704B]">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-base font-semibold text-[#24231F]">12,192+ Verified Titles</h2>
            <p className="text-xs text-[#6E685F] leading-relaxed">
              Recommend individual books, curated category hubs, or full-stack bundles to your community.
            </p>
          </div>
        </div>

        {/* Registration Form / Link Display */}
        <div className="bg-white border border-[#E8E4DC] rounded-xl p-8 shadow-book max-w-xl mx-auto">
          {!successData ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#24231F]">Register as a Partner</h3>
                <p className="text-xs text-[#6E685F] mt-1">Instant approval. Zero fee to join.</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4 text-xs font-medium text-[#24231F]">
                <div>
                  <label className="block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-3.5 py-2.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
                  />
                </div>

                <div>
                  <label className="block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-3.5 py-2.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
                  />
                </div>

                <div>
                  <label className="block mb-1">UPI ID for Payouts</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-3.5 py-2.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
                  />
                  <span className="text-[10px] text-[#81796D] mt-0.5 block">Payouts are settled directly to this address.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#24231F] hover:bg-[#3D3B35] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{loading ? 'Activating Account...' : 'Get My Referral Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#24231F]">Welcome, {successData.name}!</h3>
                <p className="text-xs text-[#6E685F] mt-1">Your referral code is <strong>{successData.code}</strong></p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-4 space-y-2 text-left">
                <span className="text-[10px] font-mono uppercase text-[#81796D]">Your Unique Referral Link:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successData.referralLink}
                    className="w-full bg-white border border-[#E8E4DC] rounded px-3 py-2 text-xs font-mono text-[#24231F]"
                  />
                  <button
                    onClick={copyLink}
                    className="px-3.5 py-2 bg-[#24231F] text-white rounded text-xs font-medium hover:bg-[#3D3B35] transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#6E685F]">
                Commission: <strong>{successData.commissionRate}</strong> per order • Direct UPI settlement
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
