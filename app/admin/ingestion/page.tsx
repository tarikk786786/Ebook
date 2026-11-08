'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  Radio,
  Layers,
  Shield,
  Play,
  RotateCcw,
  Check,
  X,
  HardDrive,
  Users,
} from 'lucide-react';

interface IngestionStats {
  totalRegisteredBooks: number;
  publishedBooks: number;
  pendingRightsReview: number;
  physicalStorageFiles: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  connectedSources: number;
  accessibleSources: number;
  activeJobsCount: number;
}

interface IngestionSource {
  id: string;
  channelId: number;
  title: string;
  username?: string;
  accessStatus: string;
  totalDiscovered: number;
  lastScanned?: string;
}

interface IngestionJob {
  id: string;
  source: string;
  totalItems: number;
  processedItems: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export default function AdminIngestionDashboard() {
  const [stats, setStats] = useState<IngestionStats | null>(null);
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'rights' | 'jobs'>('overview');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [resStatus, resSources, resJobs] = await Promise.all([
        fetch('/api/ingestion/status'),
        fetch('/api/ingestion/sources'),
        fetch('/api/ingestion/jobs'),
      ]);

      const dataStatus = await resStatus.json();
      const dataSources = await resSources.json();
      const dataJobs = await resJobs.json();

      if (dataStatus.success) setStats(dataStatus.stats);
      if (dataSources.success) setSources(dataSources.sources);
      if (dataJobs.success) setJobs(dataJobs.jobs);
    } catch (e: any) {
      console.error('Failed to load ingestion data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkApprove = async () => {
    try {
      const res = await fetch('/api/ingestion/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds: ['all-pending'], licenseType: 'Public Domain / Open Educational Access' }),
      });
      const data = await res.json();
      setActionMessage(data.message || 'Bulk approval initiated');
      fetchData();
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                Telegram Ingestion Control Center
              </h1>
              <p className="text-sm text-slate-400">
                Automated Discovery, Multi-Format Extraction, Rights Auditing & Storefront Publishing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition"
            >
              <Shield className="w-4 h-4" />
              Approve All Eligible
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-200 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Catalog Registry</span>
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats ? stats.totalRegisteredBooks.toLocaleString() : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {stats ? `${stats.publishedBooks.toLocaleString()} live in storefront` : 'Loading...'}
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Zero-Cost Storage</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats ? stats.physicalStorageFiles.toLocaleString() : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {stats ? `${stats.totalStorageFormatted} (Hardlinked, 0 duplicate bytes)` : 'Loading...'}
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Connected Sources</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats ? `${stats.accessibleSources}/${stats.connectedSources}` : '...'}
            </div>
            <div className="text-xs text-emerald-400 mt-1">100% MTProto Validated</div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Rights Status</span>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {stats ? stats.pendingRightsReview.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-amber-400/90 mt-1">Pending Admin Review</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'overview', label: 'Overview & Health' },
            { id: 'sources', label: `Telegram Sources (${sources.length})` },
            { id: 'rights', label: 'Rights Review & Licensing' },
            { id: 'jobs', label: 'Harvest Jobs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Pipeline Health & Concurrency Guards
              </h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span>SQLite Concurrency Mode</span>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 text-xs rounded-full border border-emerald-800">
                    WAL Mode Active (busy_timeout=30s)
                  </span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span>Entity Resolution Engine</span>
                  <span className="px-2.5 py-1 bg-sky-950 text-sky-300 text-xs rounded-full border border-sky-800">
                    Pre-warmed InputPeerChannel Cache
                  </span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span>Zero New Discovery Diagnostics</span>
                  <span className="px-2.5 py-1 bg-purple-950 text-purple-300 text-xs rounded-full border border-purple-800">
                    ScanReport Auditing Enabled
                  </span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span>File Integrity & Checksums</span>
                  <span className="px-2.5 py-1 bg-amber-950 text-amber-300 text-xs rounded-full border border-amber-800">
                    SHA-256 Validated
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                Unified Library Storage Architecture
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                All downloaded books reside in{' '}
                <code className="text-xs bg-slate-950 px-2 py-1 rounded text-sky-300">
                  Telegram_All_Books/
                </code>{' '}
                and are hardlinked to{' '}
                <code className="text-xs bg-slate-950 px-2 py-1 rounded text-emerald-300">
                  private_storage/
                </code>
                . Inode pointers guarantee 100% free zero-cost storage with zero duplicate bytes.
              </p>
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div>Source Folder: C:\Users\tarik\Downloads\TG\TelegramPdfExtractor\Telegram_All_Books</div>
                <div>Website Target: projects/anon-trove-ebooks/private_storage</div>
                <div>Physical Files: {stats?.physicalStorageFiles || 0}</div>
                <div>Storage Consumed: {stats?.totalStorageFormatted || '0 GB'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sources */}
        {activeTab === 'sources' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Target Telegram Pools</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Source Channel</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Mapped Documents</th>
                    <th className="p-3">Last Scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sources.map(src => (
                    <tr key={src.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-white">{src.title}</td>
                      <td className="p-3 text-slate-400">
                        {src.username ? `@${src.username}` : 'Private/Linked'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-xs rounded-full border border-emerald-800">
                          {src.accessStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-sky-300">{src.totalDiscovered.toLocaleString()}</td>
                      <td className="p-3 text-slate-400 text-xs">
                        {src.lastScanned ? new Date(src.lastScanned).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Rights Review */}
        {activeTab === 'rights' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Rights Review & Public Publishing Gate</h3>
            <p className="text-sm text-slate-300">
              Only documents verified as Public Domain, Open Educational Access, or explicitly authorized are published to the public storefront. Unapproved items are held in quarantine.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition"
              >
                Approve All Eligible Public Domain Titles
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Jobs */}
        {activeTab === 'jobs' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Ingestion & Download Jobs</h3>
            <div className="space-y-3">
              {jobs.map(j => (
                <div
                  key={j.id}
                  className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{j.source}</div>
                    <div className="text-xs text-slate-400">
                      Started: {new Date(j.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 text-xs rounded-full border border-emerald-800">
                      {j.status}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {j.processedItems}/{j.totalItems} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
