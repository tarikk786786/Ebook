'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';

interface ServiceFeeInfoBoxProps {
  amountInInr: number;
  className?: string;
}

export default function ServiceFeeInfoBox({ amountInInr, className = '' }: ServiceFeeInfoBoxProps) {
  return (
    <div className={`bg-[#0F141C] border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-slate-200 font-semibold text-xs">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>What does this ₹{amountInInr} fee cover?</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Service & Hosting
        </span>
      </div>

      <p className="text-slate-300 text-xs leading-relaxed">
        If you have the time, you can locate many of these materials across public channels and online groups for free.
      </p>

      <p className="text-slate-400 text-[11px] leading-relaxed">
        Your ₹{amountInInr} contribution does not purchase copyright or ownership. It simply pays for server hosting, file verification, and instant indexing so you do not have to spend hours searching.
      </p>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Ad-free direct access</span>
        <Link
          href="/mission"
          className="text-slate-300 hover:text-white font-medium inline-flex items-center space-x-1 transition-colors"
        >
          <span>Curator&apos;s full note</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
