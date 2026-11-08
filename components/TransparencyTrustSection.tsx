'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Check, Scale, ArrowRight, FileText, AlertCircle } from 'lucide-react';

export default function TransparencyTrustSection() {
  const commitments = [
    {
      num: '01',
      title: 'Clear Resource Status',
      desc: 'We identify whether a resource is free, paid, subscription-based, or publicly accessible.'
    },
    {
      num: '02',
      title: 'Authorized Source Linking',
      desc: 'We provide original publisher or authorized source links whenever appropriate.'
    },
    {
      num: '03',
      title: 'No False Ownership Claims',
      desc: 'We do not claim that books belong to us unless we explicitly own the intellectual property rights.'
    },
    {
      num: '04',
      title: 'Strict Distribution Criteria',
      desc: 'We only host and distribute books when we have the necessary rights or explicit permission.'
    },
    {
      num: '05',
      title: 'Honest Service Fee Clarity',
      desc: 'We do not promise that a service fee gives customers copyright ownership or unlimited redistribution rights.'
    },
    {
      num: '06',
      title: 'Transparent Pricing Before Checkout',
      desc: 'We provide 100% clear pricing before checkout with zero hidden surcharges or surprise fees.'
    },
    {
      num: '07',
      title: 'Direct DMCA & Takedown Review',
      desc: 'We maintain an active, respectful process for copyright owners to contact us and request review or immediate removal.'
    },
    {
      num: '08',
      title: 'Zero Artificial Manipulation',
      desc: 'We do not use fake testimonials, fake donation claims, fake countdown timers, or misleading guarantees.'
    }
  ];

  return (
    <section className="py-16 md:py-24 border-t border-slate-800/80 bg-[#070A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ethical Standards & Integrity</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Our Promise: Be Honest About Every Book.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Trust is earned through absolute clarity. These eight operating principles govern every listing, file, and interaction on our platform:
          </p>
        </div>

        {/* 8 Commitments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
          {commitments.map((c, idx) => (
            <div 
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[#0D121D] border border-slate-800 hover:border-slate-700 transition-all flex items-start space-x-4"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono text-xs font-black shrink-0 mt-0.5">
                {c.num}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {c.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar with Copyright Policy Link */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <Scale className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">Full Copyright & Content Policy</div>
              <div className="text-xs text-slate-400">Review our compliance procedures, rights definitions, and removal process.</div>
            </div>
          </div>
          <Link
            href="/copyright"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center space-x-1.5 transition-colors"
          >
            <span>Read Copyright Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
