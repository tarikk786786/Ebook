'use client';

import React from 'react';
import { 
  Server, 
  Database, 
  Search, 
  FileCheck2, 
  ShieldCheck, 
  Headphones, 
  Cpu 
} from 'lucide-react';

interface Props {
  condensed?: boolean;
}

export default function ServiceFeeBreakdown({ condensed = false }: Props) {
  const categories = [
    {
      icon: Database,
      title: 'Cloud Storage & Hosting',
      desc: 'High-speed object storage and encrypted mirrors for tens of thousands of digital volumes.'
    },
    {
      icon: Server,
      title: 'Servers & Infrastructure',
      desc: 'Edge compute runtimes, low-latency API handlers, and high-availability database clusters.'
    },
    {
      icon: Cpu,
      title: 'Indexing & Metadata Parsing',
      desc: 'Automated table-of-contents extraction, ISBN resolution, and edition verification.'
    },
    {
      icon: Search,
      title: 'Search Technology',
      desc: 'Instant full-text query processing, topic tags, and fast filters across 12,000+ files.'
    },
    {
      icon: FileCheck2,
      title: 'File Integrity & Repair',
      desc: 'Cryptographic SHA-256 integrity hashing and authentic cover preview extraction.'
    },
    {
      icon: ShieldCheck,
      title: 'Security & Maintenance',
      desc: 'Regular patch cycles, zero-trace privacy protection, and DDoS mitigation.'
    },
    {
      icon: Headphones,
      title: 'Reader Support',
      desc: 'Reader query assistance, takedown review processing, and platform maintenance.'
    }
  ];

  return (
    <section id="service-fee-explanation" className={`${condensed ? 'py-8' : 'py-14'} border-t border-slate-800 bg-[#070A0F]`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-2">
            Where Contributions Go
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How the small service fee is used.
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            We believe in direct transparency. The nominal fee supports ongoing server operations, storage bandwidth, and search technology:
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="p-4 rounded-lg bg-[#111622] border border-slate-800 space-y-2"
              >
                <div className="flex items-center space-x-2 text-slate-300">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold text-white">
                    {cat.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Notice */}
        <div className="mt-8 p-4 rounded-lg bg-[#111622] border border-slate-800 text-center max-w-3xl mx-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Service Notice:</strong> The service fee is intended solely to support platform maintenance and hosting. It is not a payment for copyright ownership or a guarantee that every book is free to redistribute.
          </p>
        </div>
      </div>
    </section>
  );
}
