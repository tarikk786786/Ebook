'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EbookTool, TOOL_CATEGORIES } from '@/lib/tools';
import { 
  ShieldCheck, 
  Wrench, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  Lock, 
  Key, 
  LogOut,
  Edit3,
  Check,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  Link2
} from 'lucide-react';

export default function AdminToolsPage() {
  const [tools, setTools] = useState<EbookTool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [editingTool, setEditingTool] = useState<EbookTool | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [linkVerificationResults, setLinkVerificationResults] = useState<Record<string, any>>({});
  const [actionMessage, setActionMessage] = useState<string>('');

  // Admin Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // New Tool Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newRepo, setNewRepo] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Library Management');
  const [newDesc, setNewDesc] = useState<string>('');

  const getActiveToken = () => {
    if (adminToken) return adminToken;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('anontrove_admin_secret') || '';
    }
    return '';
  };

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const token = getActiveToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('x-admin-token', token);
    }
    return fetch(url, { ...options, headers });
  };

  const verifyAndLogin = async (candidate: string) => {
    if (!candidate || candidate.trim().length < 8) {
      setAuthError('Please enter a valid administrative access secret.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const res = await fetch('/api/admin/tools', {
        headers: { 'x-admin-token': candidate.trim() },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminToken(candidate.trim());
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('anontrove_admin_secret', candidate.trim());
        }
        setTools(data.tools || []);
      } else {
        setAuthError(data.error || 'Authentication rejected: Invalid administrator credentials.');
      }
    } catch (err: any) {
      setAuthError('Network error connecting to administrative verification gateway.');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchTools = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/tools');
      const data = await res.json();
      if (res.ok && data.success) {
        setTools(data.tools || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('anontrove_admin_secret') : null;
    if (stored) {
      verifyAndLogin(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;
    try {
      setActionMessage('Saving updates...');
      const res = await adminFetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTool.id,
          updates: {
            name: editingTool.name,
            category: editingTool.category,
            shortDescription: editingTool.shortDescription,
            detailedDescription: editingTool.detailedDescription,
            officialWebsite: editingTool.officialWebsite,
            documentation: editingTool.documentation,
            isArchived: editingTool.isArchived,
            isAbandoned: editingTool.isAbandoned,
            verifiedAuthentic: editingTool.verifiedAuthentic,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✓ ${editingTool.name} updated successfully`);
        setEditingTool(null);
        fetchTools();
      } else {
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Update failed: ${err.message}`);
    }
  };

  const handleVerifyDownloadLinks = async (toolId: string) => {
    try {
      setVerifyingId(toolId);
      const res = await adminFetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: toolId,
          action: 'verify_links',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLinkVerificationResults((prev) => ({
          ...prev,
          [toolId]: data.linkStatus,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddNewTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo.trim() || !newName.trim()) return;

    try {
      setActionMessage('Registering tool...');
      const res = await adminFetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTool: {
            name: newName.trim(),
            repoFullName: newRepo.trim(),
            category: newCategory,
            shortDescription: newDesc.trim() || 'Open source ebook tool',
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✓ Tool ${newName} added!`);
        setShowAddModal(false);
        setNewRepo('');
        setNewName('');
        setNewDesc('');
        fetchTools();
      } else {
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  // Filtered tools
  const filtered = tools.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.name.toLowerCase().includes(q) || t.repoFullName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Ebook Tools Control Plane</h1>
          <p className="text-xs text-slate-400 mb-6">
            Enter administrative access secret to manage verified tools, inspect releases, and audit download links.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAndLogin(secretInput);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Enter ADMIN_ACCESS_SECRET..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            {authError && <div className="text-xs text-rose-400 text-left font-mono">{authError}</div>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
            >
              {authLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-300">
              ← Return to Main Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Store Admin
              </Link>
              <h1 className="text-2xl font-black text-white flex items-center">
                <Wrench className="w-6 h-6 mr-2 text-emerald-400" />
                Tools Directory Management
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Manage {tools.length} registered ebook repositories, approve releases, and audit download safety.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Tool</span>
            </button>
            <Link
              href="/tools"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5"
            >
              <span>View Public Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div className="rounded-xl bg-slate-900 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-slate-500 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools by name or repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories ({tools.length})</option>
              {TOOL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={fetchTools}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh tools"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tools Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tool & Repository</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Latest Release</th>
                  <th className="py-3 px-4">Stars</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Download Assets</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center">
                        <Link href={`/tools/${tool.slug}`} className="hover:text-emerald-400">
                          {tool.name}
                        </Link>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{tool.repoFullName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                        {tool.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-emerald-400 font-bold">{tool.latestRelease?.version}</div>
                      <div className="text-[10px] text-slate-500">
                        {tool.latestRelease?.publishedAt?.split('T')[0]}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      ★ {tool.stars.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {tool.isArchived || tool.isAbandoned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{tool.downloads.length} files</span>
                        <button
                          onClick={() => handleVerifyDownloadLinks(tool.id)}
                          disabled={verifyingId === tool.id}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center space-x-1"
                          title="Verify if download URLs are reachable"
                        >
                          <Link2 className="w-3 h-3 text-teal-400" />
                          <span>{verifyingId === tool.id ? 'Verifying...' : 'Verify'}</span>
                        </button>
                      </div>

                      {linkVerificationResults[tool.id] && (
                        <div className="mt-1 text-[10px] font-mono space-y-0.5">
                          {Object.entries(linkVerificationResults[tool.id]).map(([file, res]: any) => (
                            <div key={file} className={res.ok ? 'text-emerald-400' : 'text-rose-400'}>
                              {res.ok ? '✓' : '✗'} {file.slice(0, 20)}... ({res.status})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingTool(tool)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingTool && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">Edit Tool: {editingTool.name}</h2>
              <form onSubmit={handleUpdateTool} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    value={editingTool.name}
                    onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Category
                  </label>
                  <select
                    value={editingTool.category}
                    onChange={(e) => setEditingTool({ ...editingTool, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {TOOL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingTool.shortDescription}
                    onChange={(e) => setEditingTool({ ...editingTool, shortDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Official Website
                  </label>
                  <input
                    type="text"
                    value={editingTool.officialWebsite}
                    onChange={(e) => setEditingTool({ ...editingTool, officialWebsite: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="flex items-center space-x-6 pt-2">
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingTool.isArchived}
                      onChange={(e) => setEditingTool({ ...editingTool, isArchived: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                    />
                    <span>Mark as Archived / Unmaintained</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingTool.verifiedAuthentic}
                      onChange={(e) =>
                        setEditingTool({ ...editingTool, verifiedAuthentic: e.target.checked })
                      }
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                    />
                    <span>Verified Authentic</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingTool(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Register New Ebook Tool</h2>
              <p className="text-xs text-slate-400 mb-4">
                Add an official open-source repository to track releases and provide verified downloads.
              </p>

              <form onSubmit={handleAddNewTool} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Foliate"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold text-[10px] uppercase mb-1">
                    GitHub Repository (owner/repo)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. johnfactotum/foliate"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {TOOL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the tool..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Add Tool
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
