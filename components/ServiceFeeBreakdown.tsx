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
import { getSupportEmail } from '@/lib/site';

interface Props {
  condensed?: boolean;
}

export default function ServiceFeeBreakdown({ condensed = false }: Props) {
  const supportEmail = getSupportEmail();
  const categories = [
    {
      icon: Database,
      title: 'Cloud Storage & Hosting',
      desc: 'High-speed encrypted object storage and redundant CDN edge mirrors for tens of thousands of digital volumes.'
    },
    {
      icon: Server,
      title: 'Servers & Compute Runtimes',
      desc: 'Edge serverless compute, low-latency API handlers, and high-availability database clusters for instant retrieval.'
    },
    {
      icon: Cpu,
      title: 'Indexing & Metadata Parsing',
      desc: 'Automated table-of-contents extraction, ISBN resolution, author bios, and authentic edition verification.'
    },
    {
      icon: Search,
      title: 'Instant Search Technology',
      desc: 'Instant full-text query processing, semantic topic tags, and fast faceted filters across 86,260+ catalog entries.'
    },
    {
      icon: FileCheck2,
      title: 'File Integrity & Cleaning',
      desc: 'Cryptographic SHA-256 integrity hashing, virus scanning, and authentic cover preview extraction.'
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Trace Privacy & Security',
      desc: 'Fail-closed ephemeral token life cycles, constant-time HMAC payment verification, and DDoS edge mitigation.'
    },
    {
      icon: Headphones,
      title: 'Reader Support & Ethics',
      desc: `Dedicated customer support (${supportEmail}), prompt rights review handling, and continual platform maintenance.`
    }
  ];

  return (
    <section id="service-fee-explanation" className={`${condensed ? 'py-8' : 'py-14'} border-t border-[#38352F]/60 bg-[#141311]`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-[11px] font-mono tracking-wider text-[#9A704B] uppercase font-semibold">
            Transparent Cost Breakdown
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF6F1] tracking-tight">
            Where Your ₹9 – ₹29 Contribution Goes
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed">
            We believe in radical transparency. Your nominal service fee supports ongoing server operations, bandwidth, and independent education:
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-xl bg-[#1C1A17] border border-[#2D2A26] space-y-2.5 hover:border-[#9A704B]/50 transition-colors"
              >
                <div className="flex items-center space-x-2.5 text-[#FAF6F1]">
                  <div className="p-2 rounded-lg bg-[#24221E] border border-[#38352F] text-[#D4AF37]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#FAF6F1]">
                    {cat.title}
                  </h3>
                </div>
                <p className="text-xs text-[#A8A29E] leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Honest Notice */}
        <div className="mt-8 p-5 rounded-xl bg-[#1C1A17] border border-[#38352F] text-center max-w-3xl mx-auto">
          <p className="text-xs text-[#D6D3D1] leading-relaxed">
            <strong className="text-[#FAF6F1]">Curator&apos;s Policy:</strong> The service fee is intended solely to support platform maintenance, storage bandwidth, and catalog organization. It is never a payment for copyright ownership or commercial redistribution rights.
          </p>
        </div>
      </div>
    </section>
  );
}
