'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface StatusPayload {
  config: {
    aiGateway: boolean;
    googleBooks: boolean;
    metadataModel: string;
    visionModel: string;
    dailyBudget: number;
  };
  counts: Record<string, number>;
  catalogPdf: {
    curatedCount: number;
    curatedCoverMatched: number;
    directoryCount: number;
    directoryCoverMatched: number;
  };
}

export default function AiIntelligenceAdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') || '' : '';
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  const load = async (adminToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai-intelligence', {
        headers: { 'x-admin-token': adminToken },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Unauthorized');
        setAuthed(false);
        return;
      }
      setData(json);
      setAuthed(true);
      sessionStorage.setItem('admin_token', adminToken);
    } catch {
      setError('Failed to load AI intelligence status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed && token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <form
          className="w-full max-w-md space-y-4 border border-slate-800 rounded-xl p-6 bg-slate-900"
          onSubmit={(e) => {
            e.preventDefault();
            load(token);
          }}
        >
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            AI Intelligence Admin
          </h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_ACCESS_SECRET"
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
          />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 py-2 text-sm font-medium">
            Unlock
          </button>
          <Link href="/admin" className="block text-center text-xs text-slate-400 hover:text-white">
            Back to Admin
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-lg border border-slate-800 hover:border-slate-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              AI Book Intelligence
            </h1>
          </div>
          <button
            onClick={() => load(token)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                <h2 className="text-sm font-medium text-slate-300">Gateway keys</h2>
                <StatusRow ok={data.config.aiGateway} label="AI_GATEWAY_API_KEY" />
                <StatusRow ok={data.config.googleBooks} label="GOOGLE_BOOKS_API_KEY" />
                <p className="text-[11px] text-slate-500 pt-2">
                  Models: {data.config.metadataModel} / {data.config.visionModel} · daily budget {data.config.dailyBudget}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Database className="w-4 h-4" /> SQLite AI tables
                </h2>
                {Object.entries(data.counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="font-mono text-slate-400">{k}</span>
                    <span>{v < 0 ? 'missing' : v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
              <h2 className="text-sm font-medium text-slate-300">Catalog PDF enrichment</h2>
              <p className="text-xs text-slate-400">
                Curated masterclasses: {data.catalogPdf.curatedCount} books · covers matched{' '}
                {data.catalogPdf.curatedCoverMatched}
              </p>
              <p className="text-xs text-slate-400">
                86k directory overlay: {data.catalogPdf.directoryCount} titles · covers matched{' '}
                {data.catalogPdf.directoryCoverMatched}
              </p>
              <p className="text-[11px] text-slate-500">
                Re-run <code className="text-violet-300">python scripts/import_catalog_pdfs.py</code> after updating the TG
                catalog PDFs.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-mono text-slate-400">{label}</span>
      <span className={`inline-flex items-center gap-1 ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {ok ? 'SET' : 'MISSING'}
      </span>
    </div>
  );
}
