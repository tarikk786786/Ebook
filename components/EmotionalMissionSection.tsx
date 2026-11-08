'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Compass, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function EmotionalMissionSection() {
  return (
    <section className="py-16 md:py-24 border-t border-slate-800/80 bg-gradient-to-b from-[#090D14] via-[#0E1422] to-[#090D14] relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ethical Mission & Purpose</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            We Are Not Charging for the Value of Knowledge.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              We Are Making Access Easier.
            </span>
          </h2>
        </div>

        {/* Narrative Flow: 3 Empathy Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono font-black mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-2">The Aspiring Student</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Think about a student who is eager to learn, build, or conduct research, but cannot afford expensive recurring institutional subscriptions or costly international textbooks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-800/50 flex items-center justify-center text-teal-400 font-mono font-black mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-2">The Search Fatigue</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Think about someone searching for one important book across dozens of scattered websites, defunct groups, fragmented catalogues, and confusing online repositories.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-mono font-black mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-2">The Wasted Hours</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Think about the endless hours spent checking editions, finding working sources, filtering out malicious links, identifying useful material, and organizing it cleanly.
            </p>
          </div>
        </div>

        {/* Core Manifesto Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#111724] border border-slate-700/80 shadow-2xl space-y-6 text-slate-200">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Our Commitment to Truth & Convenience</span>
          </div>

          <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
            We want to reduce that effort. Our platform brings discovery, organization, and convenience together in one respectful interface.
          </p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            We do not claim to own every book, and we do not claim that every book is free everywhere. Some resources are freely accessible. Others are protected by copyright or require an authorized purchase, subscription, or library account.
          </p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            We clearly distinguish these resources so readers can make informed decisions.
          </p>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-emerald-300 font-semibold text-center sm:text-left">
              Our mission is simple: make the journey to knowledge easier, more organized, and more affordable wherever legally possible.
            </div>
            <Link 
              href="/mission" 
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center space-x-1.5 transition-colors"
            >
              <span>Read Full Philosophy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
