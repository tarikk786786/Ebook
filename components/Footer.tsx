'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';
import { getSupportEmail } from '@/lib/site';

export default function Footer() {
  const supportEmail = getSupportEmail();
  return (
    <footer className="border-t border-[#E8E4DC] bg-[#1C1917] text-[#E7E5E4] font-sans">
      {/* Editorial Mission Statement Bar */}
      <div className="bg-[#24231F] py-10 px-4 sm:px-6 lg:px-8 border-b border-[#38352F]">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#38352F] text-[#FAF6F1] text-xs font-sans font-medium">
            <Heart className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Independent Publishing House</span>
          </div>
          
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FAF6F1] tracking-tight">
            Curating high-signal technical literature for lifelong readers.
          </h3>
          
          <p className="text-sm text-[#A8A29E] leading-relaxed max-w-2xl mx-auto">
            AnonTrove is an independent digital bookstore. Curated collection of digital study guides and technical literature formatted in universal DRM-free PDF with instant in-browser reading.
          </p>
        </div>
      </div>

      {/* Navigation & Transparency Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="h-8 w-8 rounded border border-[#38352F] bg-[#24231F] flex items-center justify-center text-[#9A704B]">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="font-serif font-bold text-lg text-[#FAF6F1] group-hover:text-[#9A704B] transition-colors">
                AnonTrove
              </span>
            </Link>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Curated digital publishing platform offering computer science textbooks, software engineering handbooks, and educational study materials.
            </p>
            <div className="text-[11px] text-[#78716C] font-mono">
              Universal DRM-Free PDF • Direct UPI Delivery
            </div>
          </div>

          {/* Catalog & Top Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans uppercase tracking-wider text-[#FAF6F1] font-semibold">Catalog Pillars</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/category/programming" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Programming & Software Engineering
                </Link>
              </li>
              <li>
                <Link href="/category/cybersecurity" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Cybersecurity & Ethical Hacking
                </Link>
              </li>
              <li>
                <Link href="/category/artificial-intelligence" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Artificial Intelligence & Machine Learning
                </Link>
              </li>
              <li>
                <Link href="/category/trading-and-finance" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Trading, Quantitative & Financial Markets
                </Link>
              </li>
              <li>
                <Link href="/category/cloud-and-devops" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Cloud Infrastructure & DevOps
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Exploration */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans uppercase tracking-wider text-[#FAF6F1] font-semibold">Platform & Tools</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#catalog" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Complete Catalog
                </Link>
              </li>
              <li>
                <Link href="/#bundles" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Curated Ebook Bundles
                </Link>
              </li>
              <li>
                <Link href="/library" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Customer Personal Library
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Order History & Receipt Lookup
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors flex items-center gap-1">
                  <span>Affiliate & Referral Program</span>
                  <ArrowUpRight className="w-3 h-3 text-[#9A704B]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal, Privacy & Administration */}
          <div className="space-y-3">
            <h4 className="text-xs font-sans uppercase tracking-wider text-[#FAF6F1] font-semibold">Ethics & Transparency</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/mission" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Publishing Mission & Philosophy
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Copyright & Rights Policy
                </Link>
              </li>
              <li>
                <a href={`mailto:${supportEmail}`} className="text-[#FAF6F1] hover:text-[#9A704B] transition-colors flex items-center gap-1 font-medium">
                  <span>Support: {supportEmail}</span>
                </a>
              </li>
              <li>
                <Link href="/service-fee" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  Transparent Pricing & Service Fees
                </Link>
              </li>
              <li>
                <Link href="/admin/seo" className="text-[#A8A29E] hover:text-[#FAF6F1] transition-colors">
                  SEO & Intelligence Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-[#78716C] hover:text-[#A8A29E] transition-colors">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-[#38352F] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-3">
          <div>
            &copy; {new Date().getFullYear()} AnonTrove Independent Publishing. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 text-[#A8A29E]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9A704B]" />
              <span>Zero-Trace Privacy Architecture</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
