'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Heart, Sparkles, Scale, Info, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070A0F] text-slate-300">
      {/* Emotional Mission Statement Bar */}
      <div className="bg-gradient-to-b from-slate-900/60 to-transparent py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Our Transparent Mission</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Knowledge is valuable. Access should be easier.
          </h3>
          
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            We are building a more organized and accessible way to discover learning resources. Your support helps maintain the technology and work behind this platform.
          </p>
          
          <p className="text-xs sm:text-sm text-emerald-400/90 font-medium">
            Thank you for supporting a service that believes learning should reach everyone.
          </p>
        </div>
      </div>

      {/* Navigation & Transparency Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                <div className="h-full w-full bg-[#0B0F17] rounded-[6px] flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Anon<span className="text-emerald-400">Trove</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              An independent, privacy-conscious index and catalogue making educational material and digital literature easier to find, navigate, and learn from.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Flat service fee • 0% Platform markup • Privacy first
            </div>
          </div>

          {/* Platform Exploration */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold">Explore Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#catalog-shelf" className="hover:text-emerald-400 transition-colors">
                  Digital Ebook Catalogue (12,192 Titles)
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
                  <span>Open-Source Ebook Tools</span>
                  <span className="px-1.5 py-0.2 bg-teal-950 text-teal-400 text-[9px] rounded font-mono">33 Tools</span>
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-emerald-400 transition-colors">
                  Customer Personal Library
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-emerald-400 transition-colors">
                  Order History & Receipt Lookup
                </Link>
              </li>
            </ul>
          </div>

          {/* Mission & Transparency */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold">Mission & Ethics</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/mission" className="hover:text-emerald-400 transition-colors font-medium text-emerald-300">
                  Our Mission & Philosophy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Our Platform
                </Link>
              </li>
              <li>
                <Link href="/service-fee" className="hover:text-emerald-400 transition-colors">
                  Where Your Service Fee Goes
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="hover:text-emerald-400 transition-colors">
                  Content & Copyright Policy
                </Link>
              </li>
              <li>
                <Link href="/copyright#takedown" className="hover:text-amber-400 transition-colors text-slate-400 flex items-center space-x-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  <span>DMCA / Removal Requests</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Ethical Commitment Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold">Service Disclaimer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              The service fee is intended to support the operation and maintenance of this platform (hosting, indexing, and technology). It is not a payment for copyright ownership or a guarantee that every book is free to redistribute.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Tracker Architecture</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AnonTrove. Dedicated to accessible knowledge and ethical discovery.</p>
          <div className="flex items-center space-x-4 text-xs">
            <Link href="/mission" className="hover:text-slate-200">Mission</Link>
            <Link href="/service-fee" className="hover:text-slate-200">Service Fee</Link>
            <Link href="/copyright" className="hover:text-slate-200">Copyright</Link>
            <Link href="/about" className="hover:text-slate-200">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
