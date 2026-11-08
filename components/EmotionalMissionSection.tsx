'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';

export default function EmotionalMissionSection() {
  return (
    <section className="py-14 border-t border-slate-800 bg-[#090D14]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-2">
            Mission & Principles
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            We are not charging for the value of knowledge. We are making access easier.
          </h2>
        </div>

        {/* Narrative: 3 Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-lg bg-[#111622] border border-slate-800">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-2">
              01 • Student Barrier
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Costly Subscriptions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Think about a student eager to learn and build, but unable to afford expensive recurring subscriptions or international textbooks.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#111622] border border-slate-800">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-2">
              02 • Fragmented Search
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Hours Spent Hunting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Think about searching across dozens of forums, expired cloud folders, and broken links trying to find one clean copy.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#111622] border border-slate-800">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-2">
              03 • The Solution
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">One Organized Place</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We bring discovery, file verification, and fast searching together so learners can spend less time searching and more time reading.
            </p>
          </div>
        </div>

        {/* Distinction of Rights Statement */}
        <div className="p-5 rounded-lg bg-[#111622] border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            We do not claim ownership over every book. Some resources are open access or in the public domain, while others require official publisher purchase or university library credentials.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
            <span>Our mission: Make the journey to knowledge more organized and affordable wherever possible.</span>
            <Link
              href="/copyright"
              className="text-slate-300 hover:text-white font-medium inline-flex items-center space-x-1 underline underline-offset-4 shrink-0 transition-colors"
            >
              <span>Copyright policy</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
