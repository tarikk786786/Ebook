'use client';

import React from 'react';
import { 
  Server, 
  Database, 
  Search, 
  FileCheck2, 
  ShieldCheck, 
  Headphones, 
  Cpu, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface Props {
  condensed?: boolean;
}

export default function ServiceFeeBreakdown({ condensed = false }: Props) {
  const categories = [
    {
      icon: Database,
      title: 'Cloud Storage & File Hosting',
      desc: 'High-speed object storage, reliable CDNs, and persistent encrypted backup repositories for tens of thousands of digital volumes.'
    },
    {
      icon: Server,
      title: 'Website Servers & Infrastructure',
      desc: 'Edge compute runtimes, low-latency API handlers, and high-availability server clusters ensuring 99.9% uptime.'
    },
    {
      icon: Cpu,
      title: 'Ebook Indexing & Organization',
      desc: 'Automated metadata parsing, table-of-contents extraction, categorization algorithms, and edition verification.'
    },
    {
      icon: Search,
      title: 'Search & Discovery Technology',
      desc: 'Instant full-text query processing, topic tags, ISBN resolution, and fast filters by format and genre.'
    },
    {
      icon: FileCheck2,
      title: 'File Verification & Maintenance',
      desc: 'Cryptographic SHA-256 integrity hashing, damaged file repair, and thumbnail cover generation.'
    },
    {
      icon: ShieldCheck,
      title: 'Security & System Updates',
      desc: 'Automated patch cycles, zero-trace privacy architecture, DDoS defenses, and timing-safe webhook authentication.'
    },
    {
      icon: Headphones,
      title: 'Customer Support & Improvements',
      desc: 'Reader query assistance, DMCA/removal request auditing, new tool integrations, and ongoing UX refinements.'
    }
  ];

  return (
    <section id="service-fee-explanation" className={`${condensed ? 'py-8' : 'py-16'} border-t border-slate-800/80`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Info className="w-3.5 h-3.5" />
            <span>Honest Cost Breakdown</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Your Small Contribution Keeps the Library Running.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            We believe in total transparency. Here is how your small service fee supports the operational infrastructure that makes accessing educational resources convenient:
          </p>
        </div>

        {/* Visual Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-[#111724] border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center text-[11px] font-mono text-emerald-400/80">
                  <CheckCircle2 className="w-3 h-3 mr-1.5 shrink-0" />
                  <span>Platform Operations</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Transparency Disclaimer Box */}
        <div className="mt-10 p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center max-w-4xl mx-auto shadow-lg">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            <strong className="text-amber-400">Important Service Notice:</strong> The service fee is intended to support the operation and maintenance of this platform. It is not a payment for copyright ownership or a guarantee that every book is free to redistribute.
          </p>
        </div>
      </div>
    </section>
  );
}
