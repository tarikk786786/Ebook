import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmotionalMissionSection from '@/components/EmotionalMissionSection';
import CuratorLetterSection from '@/components/CuratorLetterSection';
import ServiceFeeBreakdown from '@/components/ServiceFeeBreakdown';
import StudentMessageSection from '@/components/StudentMessageSection';
import TransparencyTrustSection from '@/components/TransparencyTrustSection';
import { Metadata } from 'next';
import Link from 'next/link';
import { Compass, BookOpen, Heart, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Mission | Knowledge Should Never Be Out of Reach | AnonTrove',
  description: 'Our mission is to make finding and accessing educational resources easier, more organized, and more affordable for students and curious readers everywhere.',
};

export default function MissionPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#090D14]">
        {/* Mission Hero */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800/80">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Platform Philosophy & Ethics</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Knowledge Should Never Be Out of Reach.
            </h1>

            <div className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto space-y-4">
              <p>
                Millions of useful books and learning resources already exist across the internet. Some are freely available, some are available through libraries, and others require subscriptions or purchases.
              </p>
              <p>
                But finding the right book, checking its availability, identifying the correct edition and organizing everything in one place can take hours of searching.
              </p>
              <p className="font-semibold text-emerald-300">
                We built this platform to make that journey easier.
              </p>
              <p>
                Our small service fee supports the technology, storage, organization and maintenance that help bring useful learning resources together in one convenient destination.
              </p>
              <p className="text-xl sm:text-2xl font-black text-white pt-2">
                We believe that money should never be the reason someone gives up on learning.
              </p>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#catalog-shelf"
                className="px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore the Library</span>
              </Link>
              <Link
                href="#service-fee-explanation"
                className="px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all"
              >
                How Our Service Works
              </Link>
            </div>
          </div>
        </section>

        {/* Core Narrative */}
        <CuratorLetterSection />

        <EmotionalMissionSection />

        {/* Service Fee Visual Breakdown */}
        <ServiceFeeBreakdown />

        {/* Message for Students */}
        <StudentMessageSection />

        {/* Transparency Commitments */}
        <TransparencyTrustSection />
      </main>

      <Footer />
    </>
  );
}
