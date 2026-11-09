'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Scale, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

export default function TransparencyTrustSection() {
  const commitments = [
    {
      num: '01',
      title: 'Clear Resource Status',
      desc: 'We clearly state whether a digital resource is open access, public domain, study notes, or university reference material.'
    },
    {
      num: '02',
      title: 'Authorized Source Linking',
      desc: 'We provide direct links to official publisher pages and authorized digital stores (Amazon, Google Books, Crossref) for every title.'
    },
    {
      num: '03',
      title: 'No False Ownership Claims',
      desc: 'We never claim that books belong to us. Intellectual property and trademarks remain the sole property of their respective creators and publishers.'
    },
    {
      num: '04',
      title: 'Selective Distribution & Ethics',
      desc: 'We only index and distribute materials aligned with educational fair use and public archive accessibility standards.'
    },
    {
      num: '05',
      title: 'Service Fee Transparency',
      desc: 'We are completely honest: what you pay is a tiny nominal maintenance fee (₹9–₹29) for hosting and curation, NOT copyright ownership.'
    },
    {
      num: '06',
      title: 'Upfront Pricing & Zero Hidden Charges',
      desc: 'Prices are fully inclusive of GST with zero gateway surcharges, no hidden fees, and absolutely no recurring subscription traps.'
    },
    {
      num: '07',
      title: 'Prompt 24-Hour DMCA / Rights Review',
      desc: 'We maintain an active direct contact channel (apnix7@gmail.com) for authors and publishers to request instant review, correction, or removal.'
    },
    {
      num: '08',
      title: 'Zero Artificial Scarcity or Fake Urgency',
      desc: 'No countdown timers, no fake stock numbers, and no deceptive pressure tactics. Honest literature for curious minds.'
    }
  ];

  return (
    <section className="py-14 border-t border-[#38352F]/60 bg-[#12110F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-[11px] font-mono tracking-wider text-[#9A704B] uppercase font-semibold">
            Standards &amp; Commitments
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF6F1] tracking-tight">
            Our Promise: Complete Transparency for Every Book
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed">
            These eight operating principles govern every catalogue entry, price recommendation, and file download on AnonTrove:
          </p>
        </div>

        {/* 8 Commitments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {commitments.map((c, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-xl bg-[#1C1A17] border border-[#2D2A26] flex items-start space-x-3.5 hover:border-[#9A704B]/40 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#252320] border border-[#38352F] text-[#D4AF37] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                {c.num}
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-[#FAF6F1]">
                  {c.title}
                </h3>
                <p className="text-xs text-[#A8A29E] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Rights & DMCA Action Bar */}
        <div className="p-5 rounded-xl bg-[#1C1A17] border border-[#38352F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2.5 text-[#D6D3D1]">
            <Scale className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Looking for our formal legal, DMCA takedown, and copyright compliance notice?</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="mailto:apnix7@gmail.com"
              className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors flex items-center gap-1 font-mono text-[11px]"
            >
              <Mail className="w-3.5 h-3.5 text-[#9A704B]" />
              <span>apnix7@gmail.com</span>
            </a>
            <Link
              href="/copyright"
              className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-white text-[#1C1A17] font-semibold text-xs inline-flex items-center space-x-1.5 transition-colors shadow-sm shrink-0"
            >
              <span>Read Copyright Policy</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9A704B]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
