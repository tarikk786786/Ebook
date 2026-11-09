import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ShieldAlert, CheckCircle2, Mail, FileText, AlertTriangle, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Content & Copyright Policy | DMCA Takedown | AnonTrove',
  description: 'AnonTrove copyright policy, DMCA removal notice guidelines, content transparency commitments, and verified rights procedures.',
};

export default function CopyrightPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-[#090D14]">
        {/* Header */}
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Transparency</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Content & Copyright Policy
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We respect intellectual property rights and maintain strict compliance with copyright owners, educators, authors, and publishers.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          <div className="p-8 rounded-3xl bg-[#111724] border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>1. Overview & Nature of Service</span>
            </h2>
            <p>
              AnonTrove operates as an informational directory, organizational catalog, and convenience discovery utility for educational and digital reading materials.
            </p>
            <p>
              We do not claim copyright ownership over any third-party literary or academic works cataloged on this service. All intellectual property, trademarks, and copyright remain the exclusive property of their respective authors, creators, or publishers.
            </p>
            <p>
              The modest service fee paid by users is solely compensation for the hosting, indexing, file organization, search tooling, and platform maintenance required to curate and maintain this system.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#111724] border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>2. Rights & Availability Verification Standards</span>
            </h2>
            <p>
              We evaluate resources using eight distinct availability classifications:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-mono pt-2">
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300">
                • Free & Legally Downloadable
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-blue-300">
                • Public Domain Works
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300">
                • Open Access Research
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-teal-300">
                • Creative Commons Licensed
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300">
                • Authorized Distribution
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-amber-300">
                • Official Purchase Required
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-purple-300">
                • Library / Institutional Access
              </li>
              <li className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                • Availability Verified
              </li>
            </ul>
            <p className="text-xs text-slate-400 pt-2">
              We never assume that a file is free to redistribute simply because it appeared in public forums, Telegram channels, or search engines. Where redistribution rights are not held, we encourage and direct users to official publisher channels.
            </p>
          </div>

          {/* DMCA / Takedown Section */}
          <div id="takedown" className="p-8 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-6">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-black text-white">3. Notice and Takedown Procedure (DMCA / Copyright Review)</h2>
            </div>
            
            <p>
              If you are a copyright owner or an authorized agent and believe that any content cataloged on this service infringes upon your copyright, please submit a formal review or takedown notice to our designated agent.
            </p>

            <div className="space-y-2 text-xs sm:text-sm bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-white mb-2">Required Information in Notice:</div>
              <p>1. Physical or electronic signature of the copyright owner or authorized representative.</p>
              <p>2. Identification of the copyrighted work claimed to have been infringed.</p>
              <p>3. Specific URL, title, or catalog slug of the material on AnonTrove to be reviewed or removed.</p>
              <p>4. Your contact information (full name, address, telephone number, and email address).</p>
              <p>5. A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Designated Copyright Agent Email:</span>
                </div>
                <div className="text-xs font-mono text-emerald-300 mt-1">
                  apnix7@gmail.com
                </div>
              </div>
              <div className="text-xs text-slate-400 text-center sm:text-right">
                Standard turnaround: <strong className="text-white">within 24 hours</strong> of notice receipt.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
