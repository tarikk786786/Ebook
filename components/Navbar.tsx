'use client';

import React from 'react';
import { BookOpen, Search, Zap, Lock, Sparkles, Tag } from 'lucide-react';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currency?: 'INR' | 'USD';
  onToggleCurrency?: () => void;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  currency = 'INR',
  onToggleCurrency,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 text-slate-950 px-4 py-1 text-center text-[11px] font-bold tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
        <span>MEGA SALE: Over 1,600+ DRM-Free eBooks Starting at Just ₹29 • Instant Direct UPI Download</span>
        <Tag className="w-3 h-3 text-slate-900" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Anon<span className="text-emerald-400">Trove</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full font-bold">
                Mega Library
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">1,697+ Universal eBooks • Budget Prices</p>
          </div>
        </div>

        {/* Global Search Bar */}
        {onSearchChange && (
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search 1,697+ eBooks by title, author, topic (e.g. Linux, Trading, API, Notes)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
            </div>
          </div>
        )}

        {/* Action Controls & Value Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
              title="Toggle estimated display currency"
            >
              {currency === 'INR' ? '₹ INR (UPI)' : '$ USD (Approx)'}
            </button>
          )}

          {/* Privacy badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px]">No Login • Zero Logs</span>
          </div>

          {/* UPI Direct badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span className="font-bold text-[11px] sm:text-xs">0% Fee UPI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
