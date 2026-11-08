'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Sparkles, BookOpen, Compass, CheckCircle2 } from 'lucide-react';

export default function StudentMessageSection() {
  return (
    <section className="py-16 md:py-20 border-t border-slate-800/80 bg-[#090D14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#101726] to-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                A Personal Message
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                For Every Student Who Wants to Learn More.
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            <p>
              You should not have to spend your entire day searching for one useful book.
            </p>
            <p>
              You should not have to struggle with confusing websites, disorganized catalogues, or unreliable information.
            </p>
            <p>
              Whether you are a student, independent learner, researcher, or someone simply curious about the world, we want to help you spend less time searching and more time learning.
            </p>
            <p>
              A small contribution towards maintaining this service can help us keep improving the experience.
            </p>
            <p>
              And whenever a resource is legally available for free from its original source, we want to help you discover that option too.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-base sm:text-lg font-black text-white italic">
              "Knowledge becomes more powerful when it reaches more people."
            </p>
            <Link 
              href="/#catalog-shelf"
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs shrink-0 transition-all flex items-center space-x-2"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Browse Student Library</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
