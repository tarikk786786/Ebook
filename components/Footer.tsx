'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Heart, Scale } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070A0F] text-slate-300">
      {/* Editorial Mission Statement Bar */}
      <div className="bg-[#090D14] py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#111622] border border-slate-800 text-slate-300 text-xs font-mono font-medium">
            <Heart className="w-3.5 h-3.5 text-slate-400" />
            <span>Our Transparent Mission</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Knowledge is valuable. Access should be easier.
          </h3>
          
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We are building a more organized and accessible way to discover learning resources. Your support helps maintain the technology, indexing, and work behind this platform.
          </p>
          
          <p className="text-xs text-slate-500">
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
              <div className="h-8 w-8 rounded-md bg-[#111622] border border-slate-800 flex items-center justify-center text-slate-200">
                <BookOpen className="h-4 w-4 text-slate-200" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-slate-200 transition-colors">
                TBBooks
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              An independent, privacy-conscious index making educational material and digital literature easier to find, navigate, and learn from.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Flat service fee • 0% Markup • Privacy first
            </div>
          </div>

          {/* Platform Exploration */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">Explore Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#catalog-shelf" className="text-slate-400 hover:text-white transition-colors">
                  Digital Ebook Catalogue (12,192 Titles)
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-slate-400 hover:text-white transition-colors">
                  Startup & Business Catalog (1,000 Titles)
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>Open-Source Ebook Tools</span>
                  <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[9px] rounded font-mono">33 Tools</span>
                </Link>
              </li>
              <li>
                <Link href="/library" className="text-slate-400 hover:text-white transition-colors">
                  Customer Personal Library
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-slate-400 hover:text-white transition-colors">
                  Order History & Receipt Lookup
                </Link>
              </li>
            </ul>
          </div>

          {/* Mission & Transparency */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">Mission & Ethics</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/mission" className="text-slate-300 hover:text-white transition-colors font-medium">
                  Our Mission & Philosophy
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Our Platform
                </Link>
              </li>
              <li>
                <Link href="/service-fee" className="text-slate-400 hover:text-white transition-colors">
                  Where Your Service Fee Goes
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="text-slate-400 hover:text-white transition-colors">
                  Content & Copyright Policy
                </Link>
              </li>
              <li>
                <Link href="/copyright#takedown" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <Scale className="w-3 h-3 text-slate-400" />
                  <span>DMCA / Removal Requests</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Ethical Commitment Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">Service Disclaimer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-[#0F141C] p-3 rounded-md border border-slate-800">
              The service fee is intended to support the operation and maintenance of this platform (hosting, indexing, and technology). It is not a payment for copyright ownership or a guarantee that every book is free to redistribute.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Zero-Tracker Architecture</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TBBooks. Dedicated to accessible knowledge and ethical discovery.</p>
          <div className="flex items-center space-x-4 text-xs">
            <Link href="/mission" className="hover:text-slate-300">Mission</Link>
            <Link href="/service-fee" className="hover:text-slate-300">Service Fee</Link>
            <Link href="/copyright" className="hover:text-slate-300">Copyright</Link>
            <Link href="/about" className="hover:text-slate-300">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
