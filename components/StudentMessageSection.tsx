'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Heart, Sparkles } from 'lucide-react';

export default function StudentMessageSection() {
  return (
    <section className="py-14 border-t border-[#38352F]/60 bg-[#171513]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-10 rounded-2xl bg-[#1F1D1A] border border-[#38352F] space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#9A704B]/20 text-[#D4AF37]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-wider text-[#9A704B] uppercase font-semibold">
                Education First
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF6F1] mt-0.5">
                For Every Student &amp; Self-Taught Learner
              </h2>
            </div>
          </div>

          <div className="space-y-3.5 text-sm text-[#D6D3D1] leading-relaxed">
            <p>
              You should not have to spend your entire day scouring confusing forums, broken links, or expired cloud drives just to find one textbook. You should not be forced into expensive ₹1,500+ paywalls when all you want to do is learn, build, and grow your career.
            </p>
            <p>
              Whether you are a college student preparing for exams, an independent developer learning systems design, or a curious reader diving into artificial intelligence, we built AnonTrove so you can spend less time searching and more time reading.
            </p>
            <p className="font-semibold text-[#FAF6F1]">
              A ₹9–₹29 micro-contribution simply keeps the lights on, the servers fast, and the downloads direct and malware-free.
            </p>
          </div>

          <div className="pt-4 border-t border-[#38352F]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#A8A29E]">
              <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              <span>Knowledge becomes truly transformative when it is accessible to all.</span>
            </div>
            <Link 
              href="/#catalog-shelf"
              className="px-5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#1C1A17] font-semibold text-xs shrink-0 transition-colors flex items-center space-x-2 shadow-md"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#9A704B]" />
              <span>Explore Verified Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
