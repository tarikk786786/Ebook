'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ToolCard from '@/components/tools/ToolCard';
import { EbookTool, TOOL_CATEGORIES, ToolCategory } from '@/lib/tools';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  Terminal, 
  SlidersHorizontal, 
  Layers, 
  Laptop, 
  CheckCircle2, 
  ArrowUpDown,
  BookOpen,
  Cpu,
  RefreshCw,
  FolderSync,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ToolsClientProps {
  initialTools: EbookTool[];
  categoriesWithCounts: Record<string, number>;
  generatedAt: string;
}

const OS_OPTIONS = ['ALL', 'Windows', 'macOS', 'Linux', 'Android'];
const FORMAT_OPTIONS = ['ALL', 'EPUB', 'PDF', 'MOBI', 'AZW3', 'CBZ', 'TXT'];

export default function ToolsClient({ initialTools, categoriesWithCounts, generatedAt }: ToolsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedOs, setSelectedOs] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [onlyFoss, setOnlyFoss] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'stars' | 'name' | 'recent'>('stars');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter & Sort Logic
  const filteredTools = useMemo(() => {
    return initialTools
      .filter((tool) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = tool.name.toLowerCase().includes(q);
          const matchDesc = tool.shortDescription.toLowerCase().includes(q) || tool.detailedDescription.toLowerCase().includes(q);
          const matchRepo = tool.repoFullName.toLowerCase().includes(q);
          const matchCategory = tool.category.toLowerCase().includes(q) || tool.secondaryCategories.some((c) => c.toLowerCase().includes(q));
          const matchFormats = tool.supportedFormats.some((f) => f.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchRepo && !matchCategory && !matchFormats) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'ALL') {
          const inPrimary = tool.category === selectedCategory;
          const inSecondary = tool.secondaryCategories && tool.secondaryCategories.includes(selectedCategory);
          if (!inPrimary && !inSecondary) return false;
        }

        // OS filter
        if (selectedOs !== 'ALL') {
          const hasOs = tool.supportedOs.some((os) => os.toLowerCase().includes(selectedOs.toLowerCase()));
          if (!hasOs) return false;
        }

        // Format filter
        if (selectedFormat !== 'ALL') {
          const hasFmt = tool.supportedFormats.some((fmt) => fmt.toLowerCase().includes(selectedFormat.toLowerCase()));
          if (!hasFmt) return false;
        }

        // FOSS filter
        if (onlyFoss && !tool.verifiedAuthentic) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return b.stars - a.stars;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'recent') {
          const dateA = new Date(a.latestRelease?.publishedAt || 0).getTime();
          const dateB = new Date(b.latestRelease?.publishedAt || 0).getTime();
          return dateB - dateA;
        }
        return 0;
      });
  }, [initialTools, searchQuery, selectedCategory, selectedOs, selectedFormat, onlyFoss, sortBy]);

  // Featured tools selection
  const featuredTools = useMemo(() => {
    return initialTools.filter((t) => t.isFeatured).slice(0, 3);
  }, [initialTools]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
      {/* Top Global Navbar */}
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0E1522]/95 to-slate-900/90 border border-slate-800/80 p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Open-Source Ebook Software Directory</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Ebook Tools & Resources
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 font-light">
              Discover the tools to search, manage, read, convert and organize your digital library.
            </p>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{initialTools.length}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Verified Tools</div>
              </div>
              <div>
                <div className="text-2xl font-black text-teal-400 font-mono">14</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Core Categories</div>
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-400 font-mono">100%</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Free & Open Source</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400 font-mono">Official</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Direct Binaries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Tools Showcase */}
        {selectedCategory === 'ALL' && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Essential Ebook Power Tools</h2>
              </div>
              <span className="text-xs text-slate-400">Industry standard suites for library mastery</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#121926] border border-emerald-500/30 p-6 flex flex-col justify-between hover:border-emerald-500/60 transition-all shadow-lg shadow-emerald-950/10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50 uppercase tracking-wider">
                        Featured Tool
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        ★ {(tool.stars / 1000).toFixed(1)}k stars
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-1.5">{tool.name}</h3>
                    <p className="text-xs text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                      {tool.shortDescription}
                    </p>

                    <div className="space-y-1.5 mb-4 text-xs text-slate-400 font-medium">
                      {tool.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors"
                    >
                      View Full Details →
                    </Link>
                    <a
                      href={tool.downloads[0]?.downloadUrl || tool.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{tool.latestRelease?.version || 'Download'}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-5 mb-8 backdrop-blur-sm">
          {/* Main Search Input */}
          <div className="relative mb-5">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tools by name, topic (e.g. Scraper, OCR, Calibre, Kindle, EPUB, PDF)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-12 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 shadow-inner"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono hidden sm:inline-block">
              /
            </kbd>
          </div>

          {/* Sub Filters: OS, Format, Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* OS Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Operating System
              </label>
              <select
                value={selectedOs}
                onChange={(e) => setSelectedOs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {OS_OPTIONS.map((os) => (
                  <option key={os} value={os}>
                    {os === 'ALL' ? 'All Operating Systems' : os}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ebook Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {FORMAT_OPTIONS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt === 'ALL' ? 'All File Formats' : fmt}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="stars">Most Popular (GitHub Stars)</option>
                <option value="recent">Recently Updated</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* FOSS Toggle */}
            <div className="flex items-end">
              <button
                onClick={() => setOnlyFoss(!onlyFoss)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  onlyFoss
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${onlyFoss ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>Verified Authentic Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* 14 Category Navigation Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Directory Categories
            </span>
            {selectedCategory !== 'ALL' && (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs text-emerald-400 hover:underline"
              >
                Reset to All ({initialTools.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              All Tools ({initialTools.length})
            </button>

            {TOOL_CATEGORIES.map((cat) => {
              const count = categoriesWithCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-slate-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div className="text-sm font-semibold text-slate-300">
            Showing <span className="text-emerald-400 font-bold">{filteredTools.length}</span> tools
            {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Synced: {generatedAt}
          </div>
        </div>

        {/* Tools Cards Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center mb-16">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching tools found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              We couldn't find any tools matching your criteria. Try adjusting your search query, format, or category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedOs('ALL');
                setSelectedFormat('ALL');
                setOnlyFoss(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Responsible Open-Source Notice */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-200">Security & Open Source Integrity Notice</div>
              <p className="text-slate-400 text-[11px]">
                All software listed in this directory is verified from official developer repositories. We strictly index legitimate open-access, format conversion, and library management software. No paywall circumvention, DRM cracking, or copyright-infringing tools are hosted or promoted.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-mono text-[11px]"
          >
            Admin Panel →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            AnonTrove Tools & Resources Directory • Maintained with official GitHub Releases
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Book Store</Link>
            <Link href="/tools" className="hover:text-emerald-400 transition-colors">Tools Directory</Link>
            <Link href="/library" className="hover:text-emerald-400 transition-colors">My Library</Link>
            <Link href="/admin" className="hover:text-emerald-400 transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
