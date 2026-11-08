'use client';

import React from 'react';
import Link from 'next/link';
import { Info, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

interface ServiceFeeInfoBoxProps {
  amountInInr: number;
  className?: string;
}

export default function ServiceFeeInfoBox({ amountInInr, className = '' }: ServiceFeeInfoBoxProps) {
  return (
    <div className={`p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
        <Info className="w-3.5 h-3.5" />
        <span>What does your payment support?</span>
      </div>

      <p className="text-slate-300 text-xs leading-relaxed">
        Your contribution of <strong className="text-white font-mono">₹{amountInInr}</strong> helps support the infrastructure, storage, catalogue organization, search tools and maintenance that make this service convenient.
      </p>

      <p className="text-slate-400 text-[11px] leading-relaxed">
        It does not mean that we own the copyright to every listed book. All funds go directly toward ongoing server hosting, high-speed storage nodes, and search technology.
      </p>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-mono">Transparent Service Fee</span>
        <Link
          href="/service-fee"
          className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1 transition-colors"
        >
          <span>See Cost Breakdown</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
