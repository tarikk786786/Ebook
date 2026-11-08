'use client';

import React from 'react';
import Link from 'next/link';
import { Info, Sparkles, Clock, Server, ArrowRight } from 'lucide-react';

interface ServiceFeeInfoBoxProps {
  amountInInr: number;
  className?: string;
}

export default function ServiceFeeInfoBox({ amountInInr, className = '' }: ServiceFeeInfoBoxProps) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-b from-[#111726] to-slate-900/90 border border-amber-500/30 text-slate-300 text-xs space-y-3 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>The Honest Truth: What Does ₹{amountInInr} Pay For?</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold">
          CONVENIENCE FEE
        </span>
      </div>

      <p className="text-slate-300 text-xs leading-relaxed">
        <strong className="text-white">Can you find this book online for free?</strong> Yes. If you have the time to hunt through dozens of Telegram channels, WhatsApp groups, and file-hosting sites, it is likely out there.
      </p>

      <p className="text-slate-400 text-[11px] leading-relaxed">
        Your ₹{amountInInr} is <strong className="text-slate-200">not a payment for copyright or knowledge</strong>. It is a tiny convenience and maintenance fee that saves you 3+ hours of tedious searching, shields you from malicious popups, and pays for the high-speed cloud servers keeping this library accessible to students.
      </p>

      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-emerald-400 font-mono font-semibold">100% Transparent • Zero Ad Spam</span>
        <Link
          href="/mission"
          className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center space-x-1 transition-colors"
        >
          <span>Read Curator&apos;s Letter</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
