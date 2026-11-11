'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Server, BookOpen, CheckCircle2, Heart, ShieldCheck, ArrowRight } from 'lucide-react';
import { getSupportEmail } from '@/lib/site';

export default function CuratorLetterSection() {
  const supportEmail = getSupportEmail();
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 my-12">
      <div className="bg-[#1C1A17] border border-[#38352F] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9A704B]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Section Header */}
        <div className="border-b border-[#38352F]/80 pb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9A704B]/15 border border-[#9A704B]/30 text-[#D4AF37] text-[11px] font-mono uppercase tracking-wider font-semibold mb-3">
            <Heart className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
            <span>Honest Curator&apos;s Note • Why We Charge So Little</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#FAF6F1] tracking-tight">
            You don&apos;t have to pay to find these books.
          </h2>
          <p className="text-sm sm:text-base text-[#D6D3D1] mt-2 max-w-3xl leading-relaxed">
            Most of the material indexed here can be found across public channels, archives, and discussion groups if you have hours to search. Here is why this index exists and what ₹9 to ₹29 actually covers.
          </p>
        </div>

        {/* Narrative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#A8A29E] leading-relaxed relative z-10">
          <p>
            If you spend several hours digging through scattered channels, cloud folders, dead mirrors, and ad-infested forums, you can likely locate many of these files for free. <strong className="text-[#FAF6F1]">We do not claim authorship or copyright ownership over these publications.</strong>
          </p>
          <p>
            What you contribute is <strong className="text-[#FAF6F1]">never the purchase price of the book</strong>. It is a tiny, nominal service fee (₹9 to ₹29) that supports the time spent verifying, cleaning, and cataloguing complete editions, plus the ongoing monthly cost of high-speed cloud storage nodes, zero-ad direct delivery, and instant in-browser reading.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative z-10">
          <div className="bg-[#141311] border border-[#2D2A26] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center space-x-2 text-[#FAF6F1] text-xs font-semibold">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-serif text-sm">Time Saved</span>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              We locate, virus-scan, organize, and verify complete table-of-contents so you don&apos;t waste hours fighting broken links, watermarked spam, or fake files.
            </p>
          </div>

          <div className="bg-[#141311] border border-[#2D2A26] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center space-x-2 text-[#FAF6F1] text-xs font-semibold">
              <Server className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-serif text-sm">Fast Hosting & Zero Ads</span>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              High-throughput encrypted cloud storage, instant UPI webhooks, and direct DRM-free PDF delivery carry real monthly bandwidth and compute costs.
            </p>
          </div>

          <div className="bg-[#141311] border border-[#2D2A26] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center space-x-2 text-[#FAF6F1] text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-serif text-sm">Student & Learner Access</span>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Expensive ₹2,000+ paywalls lock out ambitious students and self-taught engineers. A ₹9–₹29 micro-fee democratizes learning for everyone.
            </p>
          </div>
        </div>

        {/* Honest Checklist */}
        <div className="bg-[#141311] border border-[#2D2A26] rounded-xl p-5 space-y-3 text-xs text-[#D6D3D1] relative z-10">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF6F1]">If you have time to search on your own:</strong> You do not need to pay anything here. Every reader is always free to explore public archives directly.
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF6F1]">If you want clean, instant access in one second:</strong> Your ₹9–₹29 directly covers server uptime and keeps the index online for learners worldwide.
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF6F1]">If you can afford the official publication:</strong> We encourage you to support original authors, universities, and commercial publishers directly.
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#FAF6F1]">If a title has no cover thumbnail:</strong> The file is still genuine. Cover art is recovered separately — and if anything about the ebook is wrong, you get a full refund.
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#78716C] pt-2 border-t border-[#38352F]/80 gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Transparent Zero-Deception Guarantee • Dedicated Reader Support: {supportEmail}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/mission"
              className="text-[#FAF6F1] hover:text-[#D4AF37] font-medium transition-colors flex items-center gap-1"
            >
              <span>Full Mission &amp; Service Fee Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
