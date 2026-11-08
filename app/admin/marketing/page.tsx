'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Mail,
  DollarSign,
  Layers,
  ArrowLeft,
  RefreshCw,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Send,
  Lock,
  Key,
  LogOut,
  ExternalLink
} from 'lucide-react';

export default function AdminMarketingDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'affiliates' | 'bundles'>('subscribers');

  const getActiveToken = () => {
    if (adminToken) return adminToken;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('anontrove_admin_secret') || '';
    }
    return '';
  };

  const verifyAndLogin = async (candidate: string) => {
    if (!candidate || candidate.trim().length < 8) {
      setAuthError('Please enter a valid administrative access secret.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const res = await fetch('/api/admin/marketing', {
        headers: { 'x-admin-token': candidate.trim() }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(candidate.trim());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('anontrove_admin_secret', candidate.trim());
        }
        setIsAuthenticated(true);
        setStats(data.stats);
        setSubscribers(data.subscribers);
        setAffiliates(data.affiliates);
        setBundles(data.bundles);
      } else {
        setAuthError(data.error || 'Access Denied: Invalid Administrative Secret.');
      }
    } catch {
      setAuthError('Connection error during admin validation.');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadData = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/marketing', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setSubscribers(data.subscribers);
        setAffiliates(data.affiliates);
        setBundles(data.bundles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getActiveToken();
    if (stored) {
      verifyAndLogin(stored);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E8E4DC] rounded-2xl p-8 shadow-book">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#FAF6F1] border border-[#F2E8DC] rounded-xl text-[#9A704B]">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight">Marketing Admin</h1>
              <p className="text-xs text-[#81796D]">AnonTrove Audience & Referral Console</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {authError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLogin(secretInput); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B5449] mb-1">Administrative Secret</label>
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Enter ADMIN_ACCESS_SECRET"
                className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-4 py-2.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-[#24231F] hover:bg-[#3D3B35] disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              {authLoading ? 'Verifying...' : 'Access Marketing Console'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E8E4DC] flex justify-between text-xs text-[#81796D]">
            <span>AnonTrove Platform</span>
            <Link href="/" className="text-[#9A704B] hover:underline">Return Storefront</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-[#E8E4DC] bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-[#FAF8F5] rounded-lg text-[#81796D] hover:text-[#24231F] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FAF6F1] border border-[#F2E8DC] rounded-lg text-[#9A704B]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg">Marketing & Audience Intelligence</h1>
                <span className="text-[10px] bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC] px-2 py-0.5 rounded-full font-sans font-semibold">LIVE</span>
              </div>
              <p className="text-xs text-[#81796D]">Email Subscribers, Referral Partners, and Product Bundles</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-[#FAF8F5] hover:bg-white text-[#24231F] rounded-lg border border-[#E8E4DC] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('anontrove_admin_secret');
              setIsAuthenticated(false);
            }}
            className="p-1.5 text-[#81796D] hover:text-rose-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book">
            <div className="flex items-center justify-between text-xs text-[#81796D]">
              <span>Email Subscribers</span>
              <Mail className="w-4 h-4 text-[#9A704B]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#24231F] mt-2">
              {stats?.totalSubscribers || 0}
            </div>
            <p className="text-[11px] text-[#81796D] mt-1">Verified Opt-in Audience</p>
          </div>

          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book">
            <div className="flex items-center justify-between text-xs text-[#81796D]">
              <span>Affiliate Partners</span>
              <Award className="w-4 h-4 text-[#9A704B]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#24231F] mt-2">
              {stats?.totalAffiliates || 0}
            </div>
            <p className="text-[11px] text-[#81796D] mt-1">Active Referrers (20% Comm)</p>
          </div>

          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book">
            <div className="flex items-center justify-between text-xs text-[#81796D]">
              <span>Curated Bundles</span>
              <Layers className="w-4 h-4 text-[#9A704B]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#24231F] mt-2">
              {stats?.activeBundlesCount || 4}
            </div>
            <p className="text-[11px] text-[#81796D] mt-1">Full-Stack & Security Vaults</p>
          </div>

          <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book">
            <div className="flex items-center justify-between text-xs text-[#81796D]">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#9A704B]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#24231F] mt-2">
              ₹{stats?.totalRevenueInInr || 0}
            </div>
            <p className="text-[11px] text-[#81796D] mt-1">Direct Bank Settled</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8E4DC] text-xs font-medium space-x-6">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'subscribers' ? 'border-[#24231F] text-[#24231F] font-bold' : 'border-transparent text-[#81796D] hover:text-[#24231F]'}`}
          >
            Subscribers ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'affiliates' ? 'border-[#24231F] text-[#24231F] font-bold' : 'border-transparent text-[#81796D] hover:text-[#24231F]'}`}
          >
            Affiliates ({affiliates.length})
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'bundles' ? 'border-[#24231F] text-[#24231F] font-bold' : 'border-transparent text-[#81796D] hover:text-[#24231F]'}`}
          >
            Bundles ({bundles.length})
          </button>
        </div>

        {/* Tab 1: Subscribers */}
        {activeTab === 'subscribers' && (
          <div className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden shadow-book">
            <div className="p-4 border-b border-[#E8E4DC] flex justify-between items-center">
              <h3 className="font-serif text-sm font-bold text-[#24231F]">Recent Opt-in Subscribers</h3>
              <span className="text-xs text-[#81796D]">Consent recorded • Zero spam</span>
            </div>
            {subscribers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#81796D]">
                No newsletter subscribers yet. Subscriptions via homepage and sample downloads will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#81796D] border-b border-[#E8E4DC]">
                    <tr>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Subscribed At</th>
                      <th className="py-2.5 px-4">Source</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DC] text-[11px]">
                    {subscribers.map((s, i) => (
                      <tr key={i} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-4 font-mono font-medium text-[#24231F]">{s.email}</td>
                        <td className="py-3 px-4 text-[#81796D]">{new Date(s.subscribedAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#6E685F]">{s.source}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC] rounded font-semibold">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Affiliates */}
        {activeTab === 'affiliates' && (
          <div className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden shadow-book">
            <div className="p-4 border-b border-[#E8E4DC] flex justify-between items-center">
              <h3 className="font-serif text-sm font-bold text-[#24231F]">Registered Partner Affiliates</h3>
              <span className="text-xs text-[#81796D]">20% Commission • UPI Settled</span>
            </div>
            {affiliates.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#81796D]">
                No affiliates registered yet. Partners registering at <Link href="/affiliate" className="text-[#9A704B] underline">/affiliate</Link> will be listed here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#81796D] border-b border-[#E8E4DC]">
                    <tr>
                      <th className="py-2.5 px-4">Partner Name</th>
                      <th className="py-2.5 px-4">Referral Code</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">UPI ID</th>
                      <th className="py-2.5 px-4">Referrals</th>
                      <th className="py-2.5 px-4">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DC] text-[11px]">
                    {affiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-4 font-medium text-[#24231F]">{a.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#9A704B]">{a.code}</td>
                        <td className="py-3 px-4 text-[#6E685F]">{a.email}</td>
                        <td className="py-3 px-4 font-mono text-[#81796D]">{a.upiId}</td>
                        <td className="py-3 px-4 font-bold text-[#24231F]">{a.totalReferrals}</td>
                        <td className="py-3 px-4 font-serif font-bold text-[#24231F]">₹{a.totalEarningsInInr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bundles */}
        {activeTab === 'bundles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((b) => (
              <div key={b.id} className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold bg-[#FAF6F1] text-[#9A704B] px-2 py-0.5 rounded border border-[#F2E8DC]">
                    {b.badge}
                  </span>
                  <span className="font-serif font-bold text-base text-[#24231F]">₹{b.priceInInr}</span>
                </div>
                <h4 className="font-serif text-base font-bold text-[#24231F]">{b.title}</h4>
                <p className="text-xs text-[#6E685F]">{b.description}</p>
                <div className="pt-2 border-t border-[#E8E4DC] flex justify-between text-xs text-[#81796D]">
                  <span>{b.bookCount} Editions</span>
                  <Link href={`/#bundles`} className="text-[#9A704B] hover:underline flex items-center gap-1">
                    <span>View on Storefront</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
