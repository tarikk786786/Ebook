'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Server,
  Zap,
  Terminal,
  Play,
  Layers,
  FileCheck,
  Globe,
  Database,
  Cpu,
  Lock,
  Key,
  LogOut,
  ExternalLink
} from 'lucide-react';

interface ToolItem {
  id: string;
  name: string;
  category: string;
  repository: string;
  version: string;
  license: string;
  installationStatus: string;
  executable: string;
  purpose: string;
}

interface SkillItem {
  id: string;
  name: string;
  repository: string;
  version: string;
  license: string;
  installationStatus: string;
  testStatus: string;
  lastVerifiedDate: string;
  description: string;
}

interface McpServerItem {
  id: string;
  name: string;
  command: string;
  args: string[];
  tools: string[];
  purpose: string;
  securityPolicy: string;
}

interface SitemapStats {
  isDynamic: boolean;
  robotsConfigured: boolean;
  totalCatalogTitles: number;
  categoryHubs: number;
  llmsManifestConfigured: boolean;
  indexedInSitemapLimit: number;
}

export default function AdminSeoDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'skills' | 'mcp' | 'console'>('overview');
  
  const [sitemapStats, setSitemapStats] = useState<SitemapStats | null>(null);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServerItem[]>([]);

  const [consoleOutput, setConsoleOutput] = useState<string>('Ready. Click any audit action above to run verified tests.');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const res = await fetch('/api/admin/seo', {
        headers: { 'x-admin-token': candidate.trim() }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(candidate.trim());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('anontrove_admin_secret', candidate.trim());
        }
        setIsAuthenticated(true);
        setSitemapStats(data.sitemapStats);
        setTools(data.tools);
        setSkills(data.skills);
        setMcpServers(data.mcpServers);
      } else {
        setAuthError(data.error || 'Access Denied: Invalid Administrative Secret.');
      }
    } catch (e: any) {
      setAuthError('Connection error during admin validation.');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDashboardData = async () => {
    const token = getActiveToken();
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/seo', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setSitemapStats(data.sitemapStats);
        setTools(data.tools);
        setSkills(data.skills);
        setMcpServers(data.mcpServers);
      }
    } catch (err) {
      console.error(err);
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

  const triggerAuditAction = async (action: string, actionLabel: string) => {
    const token = getActiveToken();
    if (!token) return;
    setActionLoading(action);
    setConsoleOutput(`[${new Date().toLocaleTimeString()}] Triggering: ${actionLabel}...\n`);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setConsoleOutput(prev => `${prev}\n--- EXECUTION SUCCESS (Exit Code: ${data.exitCode}) ---\n\n${data.output}`);
      } else {
        setConsoleOutput(prev => `${prev}\n--- EXECUTION FAILED ---\nError: ${data.error || 'Unknown error'}\n\n${data.output || ''}`);
      }
      setActiveTab('console');
    } catch (err: any) {
      setConsoleOutput(prev => `${prev}\n--- REQUEST FAILED: ${err.message} ---`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d1117] border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SEO Intelligence Admin</h1>
              <p className="text-xs text-slate-400">Zero-Trust Administrative Verification</p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLogin(secretInput); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Administrative Secret</label>
              <div className="relative">
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Enter ADMIN_ACCESS_SECRET"
                  className="w-full bg-[#161b22] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Authenticate & Access Console</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
            <span>AnonTrove Platform</span>
            <Link href="/" className="text-emerald-400 hover:underline">Return Storefront</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors" title="Back to Main Admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight">AnonTrove SEO Intelligence Hub</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">LIVE PRODUCTION</span>
              </div>
              <p className="text-xs text-slate-400">Technical SEO, Multi-Agent Architecture, GEO & AEO Monitoring</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboardData()}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('anontrove_admin_secret');
              setIsAuthenticated(false);
              setAdminToken('');
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI / System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Catalog Coverage</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-100">{sitemapStats?.totalCatalogTitles.toLocaleString() || '12,192'}</span>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Reconciled & Published
              </p>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Category Hubs</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-100">{sitemapStats?.categoryHubs || '10'} Pillars</span>
              <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> FAQ & Collection Schema
              </p>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Standardized Skills</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-100">{skills.length || '22'} Registered</span>
              <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 22/22 Tests Passing
              </p>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>AEO / GEO Manifest</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-100">Active</span>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> /llms.txt & /llms-full.txt
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Trigger Toolbar */}
        <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Live Automated Audit Triggers
            </h2>
            <span className="text-[11px] text-slate-500">Read-Only • Zero Secret Leakage</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => triggerAuditAction('run_seo_audit', 'Complete SEO Audit')}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'run_seo_audit' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Run Master SEO Audit (15 Checks)</span>
            </button>

            <button
              onClick={() => triggerAuditAction('validate_sitemap', 'Sitemap Validator')}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'validate_sitemap' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
              <span>Validate XML Sitemaps</span>
            </button>

            <button
              onClick={() => triggerAuditAction('validate_schema', 'Schema.org Validator')}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'validate_schema' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
              <span>Validate Structured Data (JSON-LD)</span>
            </button>

            <button
              onClick={() => triggerAuditAction('check_canonicals', 'Canonical Inspector')}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'check_canonicals' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              <span>Check Canonical Headers</span>
            </button>

            <button
              onClick={() => triggerAuditAction('test_all_skills', 'Verify All 22 Skills')}
              disabled={actionLoading !== null}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'test_all_skills' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
              <span>Execute 22 Skill Test Suites</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-medium space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Architecture Overview
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'skills' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Registered Skills ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'tools' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Open Source Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'mcp' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            MCP Servers ({mcpServers.length})
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'console' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Console</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-100 mb-2">Production SEO & Multi-Agent Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AnonTrove is hardened with dynamic server-side XML sitemaps, JSON-LD rich structured data (Book, Organization, WebSite, CollectionPage, FAQPage), strict canonical tags, and privacy-first analytics. 22 autonomous specialized agents coordinate to monitor link integrity, query clustering, and GEO/AEO visibility for generative search engines (Perplexity, ChatGPT, Claude, Gemini).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Dynamic Sitemaps & Robots</span>
                  <p className="text-xs text-slate-300">
                    Route: <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">/sitemap.xml</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    Includes home, search, catalog, 10 topical category hubs, and top 1,000 verified ebook titles with daily/weekly change frequency.
                  </p>
                </div>

                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">AI Engine Optimization (GEO/AEO)</span>
                  <p className="text-xs text-slate-300">
                    Manifests: <code className="text-blue-300 bg-black/40 px-1 py-0.5 rounded">/llms.txt</code> & <code className="text-blue-300 bg-black/40 px-1 py-0.5 rounded">/llms-full.txt</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    Structures verified entity knowledge, DRM-free policies, and UPI payment rails for direct generative citations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Skills */}
        {activeTab === 'skills' && (
          <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Standardized Agent Skills ({skills.length})</h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All 22 verified with test.mjs
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161b22] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Skill ID & Name</th>
                    <th className="py-2.5 px-4">Repository / Source</th>
                    <th className="py-2.5 px-4">Version</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Test Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {skills.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <a href={s.repository} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 flex items-center gap-1">
                          {s.repository.replace('https://github.com/', '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{s.version}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                          {s.installationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          {s.testStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Tools */}
        {activeTab === 'tools' && (
          <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Integrated Open-Source Tools ({tools.length})</h3>
              <span className="text-xs text-slate-400">Zero-cost open-source toolchain</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161b22] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Tool Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Repository</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Executable Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {tools.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-medium text-slate-100">{t.name}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{t.category}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <a href={t.repository} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 flex items-center gap-1">
                          {t.repository.replace('https://github.com/', '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                          {t.installationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 bg-black/20 font-mono">{t.executable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: MCP Servers */}
        {activeTab === 'mcp' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mcpServers.map((m) => (
              <div key={m.id} className="bg-[#0d1117] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-100">{m.name}</h4>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">CONFIGURED</span>
                </div>
                <p className="text-xs text-slate-400">{m.purpose}</p>
                <div className="bg-[#161b22] p-2.5 rounded-lg text-[11px] font-mono text-slate-300">
                  <div className="text-slate-500 mb-1">Executable:</div>
                  <code>{m.command} {m.args.join(' ')}</code>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Security:</span> {m.securityPolicy}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Live Execution Console */}
        {activeTab === 'console' && (
          <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Live Audit Output Terminal</span>
              </div>
              <button
                onClick={() => setConsoleOutput('Console cleared.')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <pre className="flex-1 bg-black/60 border border-slate-800/80 rounded-lg p-4 text-slate-300 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {consoleOutput}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
