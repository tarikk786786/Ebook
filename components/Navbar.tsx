'use client';

import React from 'react';
import { ShieldCheck, Zap, Lock, BookOpen } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">Anon<span className="text-emerald-400">Trove</span></span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 rounded">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Zero-Trace Digital Bookshelf</p>
          </div>
        </div>

        {/* Live Badges */}
        <div className="flex items-center space-x-3">
          {/* Privacy badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>0% Logs • No Accounts</span>
          </div>

          {/* FamGateway badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span className="font-medium">FamGateway 0% Fee UPI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
