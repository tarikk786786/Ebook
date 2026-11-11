'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Settings2, AlertCircle, Save } from 'lucide-react';
import { DEFAULT_REWARD_SPLIT_SETTINGS } from '@/lib/community/validation';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.sessionStorage.getItem('anontrove_admin_secret') ||
    window.sessionStorage.getItem('admin_token') ||
    ''
  );
}

export default function AdminCommunitySettingsPage() {
  const [rewardJson, setRewardJson] = useState('');
  const [pricingJson, setPricingJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/community-settings', {
        headers: { 'x-admin-token': getAdminToken() },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const settings = json.settings || {};
      setRewardJson(
        JSON.stringify(
          settings.reward_split ?? DEFAULT_REWARD_SPLIT_SETTINGS,
          null,
          2,
        ),
      );
      setPricingJson(
        JSON.stringify(
          settings.pricing_rules ?? {
            maxSuggestedPriceRetailFraction: 0.1,
          },
          null,
          2,
        ),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let rewardSplit: unknown;
      let pricingRules: unknown;
      try {
        rewardSplit = JSON.parse(rewardJson);
        pricingRules = JSON.parse(pricingJson);
      } catch {
        throw new Error('Invalid JSON in one of the editors');
      }
      const res = await fetch('/api/admin/community-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ rewardSplit, pricingRules }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      setMessage(`Updated: ${(json.result?.changed || []).join(', ')}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-violet-400" />
              Community Platform Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Reward split and pricing rules in `community_marketplace.sqlite` — not client-trusted.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-slate-950 text-xs font-semibold disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>

        {(error || message) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm flex gap-2 ${
              error ? 'border-rose-800/60 bg-rose-950/40' : 'border-emerald-800/60 bg-emerald-950/30'
            }`}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error || message}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-xs text-slate-400">reward_split</label>
          <textarea
            value={rewardJson}
            onChange={(e) => setRewardJson(e.target.value)}
            className="w-full min-h-[220px] font-mono text-[11px] rounded-xl border border-slate-800 bg-slate-950/80 p-3"
            spellCheck={false}
          />
          <label className="block text-xs text-slate-400">pricing_rules</label>
          <textarea
            value={pricingJson}
            onChange={(e) => setPricingJson(e.target.value)}
            className="w-full min-h-[120px] font-mono text-[11px] rounded-xl border border-slate-800 bg-slate-950/80 p-3"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
