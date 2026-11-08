import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceFeeBreakdown from '@/components/ServiceFeeBreakdown';
import TransparencyTrustSection from '@/components/TransparencyTrustSection';
import { Metadata } from 'next';
import Link from 'next/link';
import { Scale, Heart, Info, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Where Your Service Fee Goes | Transparency | AnonTrove',
  description: 'Detailed explanation of why AnonTrove charges a small service fee, what infrastructure it supports, and how it enables students to access knowledge affordably.',
};

export default function ServiceFeePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#090D14]">
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Financial Transparency</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Honest Pricing. Real Infrastructure Costs.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We charge a modest service fee starting at ₹29. We do not sell copyright ownership — we provide a curated, fast, secure discovery and storage service.
            </p>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <ServiceFeeBreakdown />

        {/* FAQ on Service Fees */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-8">
            Frequently Asked Questions About Our Service Fee
          </h2>

          <div className="space-y-4 text-sm">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Am I paying for the copyright of the book?</h3>
              <p className="text-slate-300 leading-relaxed">
                No. You are contributing towards the maintenance, indexing, hosting, and curation labor required to keep this library running, reliable, and accessible. If an official publisher purchase is required, we encourage purchasing through authorized commercial channels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Why not make everything 100% free with ads?</h3>
              <p className="text-slate-300 leading-relaxed">
                Advertising networks track user browsing, infect devices with malicious popups, and degrade the learning experience. We refuse to sell user data or inject ads. A tiny service fee keeps the platform fast, dignified, and 100% privacy-respecting.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">What payment method do you support?</h3>
              <p className="text-slate-300 leading-relaxed">
                We support direct FamPay UPI QR payments, which settle peer-to-peer with 0% transaction fees and instant delivery.
              </p>
            </div>
          </div>
        </section>

        {/* Commitments */}
        <TransparencyTrustSection />
      </main>

      <Footer />
    </>
  );
}
