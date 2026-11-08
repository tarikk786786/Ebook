'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, HardDrive, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle, AlertTriangle, Cloud, Server } from 'lucide-react';

interface StorageStats {
  success: boolean;
  provider: 'b2' | 'local' | 's3' | 'r2';
  connection: { ok: boolean; message?: string };
  stats: {
    totalBytes: number;
    totalGb: string;
    objectCount: number;
    targetCapacityGb: string;
    usagePercent: string;
    bucket: string;
  };
  envConfigured: {
    hasB2Keys: boolean;
    b2Endpoint: string;
    b2Bucket: string;
  };
}

export default function AdminStoragePage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/storage/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load storage statistics');
      }
    } catch (err: any) {
      setError(err.message || 'Network request failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-emerald-400" />
                Vault Storage & Infrastructure
              </h1>
              <p className="text-sm text-slate-400">
                5 TB Scalable Object Storage, Backblaze B2 S3 Adapter & Telegram Ingest State
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-semibold transition-colors"
            >
              View Storefront
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm">Querying vault telemetry...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Active Provider</span>
                  {stats.provider === 'b2' ? (
                    <Cloud className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Server className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white capitalize">
                  {stats.provider === 'b2' ? 'Backblaze B2' : 'Local Vault'}
                </div>
                <div className="text-xs text-slate-400">
                  {stats.provider === 'b2' ? 'S3-Compatible Object Store' : 'Local Disk Fallback'}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Storage Used</span>
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.stats.totalGb}
                </div>
                <div className="text-xs text-slate-400">
                  Target: {stats.stats.targetCapacityGb}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Total Objects</span>
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.stats.objectCount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">
                  PDF, EPUB & Cover Binaries
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Vault Health</span>
                  {stats.connection.ok ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.connection.ok ? 'Healthy' : 'Notice'}
                </div>
                <div className="text-xs text-slate-400 truncate" title={stats.connection.message}>
                  {stats.connection.message || 'Direct S3 Handshake OK'}
                </div>
              </div>
            </div>

            {/* Storage Progress Gauge */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">5 TB Cloud Storage Quota</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monthly billing: ~$30/mo on Backblaze B2 ($0.006/GB) vs $115/mo on AWS S3
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{stats.stats.usagePercent} used</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(parseFloat(stats.stats.usagePercent), 1)}%` }}
                />
              </div>
            </div>

            {/* Adapter & Credentials Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Delivery & Signed URL Configuration
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Delivery Architecture:</span>
                    <span className="text-white font-medium">HTTP 307 Direct Redirect (Zero Serverless Proxy)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Signed URL Expiry:</span>
                    <span className="text-white font-medium">900 seconds (15 minutes TTL)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Token Validation:</span>
                    <span className="text-emerald-400 font-medium">AES-256-GCM Cryptographic Decryption</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Active Bucket:</span>
                    <span className="text-white font-mono bg-slate-800/70 px-2 py-0.5 rounded">{stats.stats.bucket}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Background Workers & Archives
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Telegram Importer:</span>
                    <span className="text-white font-mono">workers/telegram_importer.py</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Local State DB:</span>
                    <span className="text-white font-mono">data/import_state.db (SQLite)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Cover Extractor:</span>
                    <span className="text-emerald-400 font-medium">PyMuPDF (fitz) @ 300 DPI Rendering</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">B2 Keys Configured:</span>
                    <span className={`font-semibold ${stats.envConfigured.hasB2Keys ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {stats.envConfigured.hasB2Keys ? 'Ready (appinfo11.txt)' : 'Local Storage Mode'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
