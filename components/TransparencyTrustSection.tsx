'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';

export default function TransparencyTrustSection() {
  const commitments = [
    {
      num: '01',
      title: 'Clear Resource Status',
      desc: 'We identify whether a resource is free, paid, subscription-based, or open access.'
    },
    {
      num: '02',
      title: 'Authorized Source Linking',
      desc: 'We provide original publisher or authorized source links whenever appropriate.'
    },
    {
      num: '03',
      title: 'No False Ownership Claims',
      desc: 'We do not claim that books belong to us unless we explicitly hold author rights.'
    },
    {
      num: '04',
      title: 'Selective Distribution',
      desc: 'We only index and distribute materials following verified open or accessible archive procedures.'
    },
    {
      num: '05',
      title: 'Service Fee Transparency',
      desc: 'We never claim that a service fee gives customers copyright ownership or redistribution rights.'
    },
    {
      num: '06',
      title: 'Clear Upfront Pricing',
      desc: 'We show exact pricing before checkout with zero surprise surcharges or artificial fees.'
    },
    {
      num: '07',
      title: 'Prompt DMCA & Rights Contact',
      desc: 'We maintain a direct contact avenue for copyright owners to request review or removal.'
    },
    {
      num: '08',
      title: 'Zero Artificial Scarcity',
      desc: 'We do not use fake countdown timers, fake scarcity badges, or deceptive sales pressure.'
    }
  ];

  return (
    <section className="py-14 border-t border-slate-800 bg-[#070A0F]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-2">
            Standards & Commitments
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Our promise: Be honest about every book.
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            These eight operating principles govern every catalogue entry and transaction on our platform:
          </p>
        </div>

        {/* 8 Commitments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-10">
          {commitments.map((c, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-lg bg-[#111622] border border-slate-800 flex items-start space-x-3"
            >
              <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5">
                {c.num}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Copyright Policy Link */}
        <div className="p-4 rounded-lg bg-[#111622] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Scale className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Looking for our formal legal and copyright compliance procedures?</span>
          </div>
          <Link
            href="/copyright"
            className="text-white hover:text-slate-200 font-semibold inline-flex items-center space-x-1 underline underline-offset-4 shrink-0 transition-colors"
          >
            <span>Read Copyright Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
