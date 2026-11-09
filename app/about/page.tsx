import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TransparencyTrustSection from '@/components/TransparencyTrustSection';
import { Metadata } from 'next';
import Link from 'next/link';
import { Info, BookOpen, Users, Globe, ShieldCheck, Heart, Sparkles, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | AnonTrove',
  description: 'Learn about AnonTrove — who we are, why we built this platform, and how we help learners discover, verify, and access educational ebooks and documentation.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#090D14]">
        {/* About Hero */}
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>About Our Platform</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              A Platform Built to Save You Time and Effort.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We are an independent digital indexing and library convenience service dedicated to making knowledge discovery fast, organized, and straightforward.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="p-8 rounded-3xl bg-[#111724] border border-slate-800 space-y-5 text-slate-300 leading-relaxed text-sm sm:text-base">
            <h2 className="text-xl sm:text-2xl font-black text-white">Who We Are & What We Do</h2>
            <p>
              Finding high-value technical literature, academic manuals, textbooks, and professional guides online has become increasingly painful. Links rot, files are mislabeled, scam sites demand invasive credit card details, and searching through hundreds of scattered groups wastes valuable study hours.
            </p>
            <p>
              AnonTrove was created as a clean, respectful solution. We catalog, verify, index, and organize digital literature across essential disciplines: Software Engineering, Artificial Intelligence, Cybersecurity, Financial Markets, Business Architecture, and Self-Improvement.
            </p>
            <p className="font-semibold text-white">
              We do not claim to own every book or author rights. Instead, we act as an organizational bridge — saving you hours of searching by hosting clean, verified, instant-reading copies and directing readers to authorized sources.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <BookOpen className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">12,000+ Curated Titles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organized with verified metadata, table of contents, edition info, and crisp cover previews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Zero-Trace Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No tracking cookies, no mandatory passwords, no marketing spam. You read and learn in peace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <Heart className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Fair Micro-Service Fee</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A tiny contribution (starting at ₹29) that directly pays for server bandwidth, storage, and platform maintenance.
              </p>
            </div>
          </div>

          {/* Direct Support & Contact Card */}
          <div className="p-8 rounded-3xl bg-[#111724] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Dedicated Reader & Author Support</span>
              </div>
              <h3 className="text-xl font-bold text-white">Have questions, rights inquiries, or need reading assistance?</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Our support team is available 24/7 to assist with download access, receipt retrieval, format inquiries, and official publisher/author correspondence.
              </p>
            </div>
            <a
              href="mailto:apnix7@gmail.com"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <span>Email: apnix7@gmail.com</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Transparency Commitments */}
        <TransparencyTrustSection />
      </main>

      <Footer />
    </>
  );
}
