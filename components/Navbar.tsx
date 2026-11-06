'use client';

import React from 'react';
import { ShieldCheck, Zap, Lock, BookOpen, Search, Shield } from 'lucide-react';

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
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white">
                Anon<span className="text-emerald-400">Trove</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 rounded">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Zero-Trace Digital Bookshelf</p>
          </div>
        </div>

        {/* Search Input (Integrated into Navbar) */}
        {onSearchChange && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search manuals, titles, authors..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Live Badges & Currency Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Toggle estimated display currency"
            >
              {currency === 'INR' ? '₹ INR (UPI)' : '$ USD (Approx)'}
            </button>
          )}

          {/* Privacy badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>0% Logs • No Accounts</span>
          </div>

          {/* UPI Direct badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span className="font-medium text-[11px] sm:text-xs">Direct 0% Fee UPI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
