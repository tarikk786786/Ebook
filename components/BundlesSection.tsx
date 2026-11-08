'use client';

import React from 'react';
import Link from 'next/link';
import { CURATED_BUNDLES, EbookBundle } from '@/lib/bundles';
import { Layers, CheckCircle2, Zap, ArrowRight, BookOpen } from 'lucide-react';
import { Book } from '@/lib/catalog';

interface BundlesSectionProps {
  onSelectBuy?: (book: Book) => void;
  currency?: 'INR' | 'USD';
}

export default function BundlesSection({ onSelectBuy, currency = 'INR' }: BundlesSectionProps) {
  const handleBuyBundle = (bundle: EbookBundle) => {
    if (onSelectBuy) {
      // Treat bundle as a multi-item collection book item for checkout
      const bundleBookItem = {
        id: bundle.id,
        slug: bundle.slug,
        title: bundle.title,
        subtitle: bundle.subtitle,
        author: 'AnonTrove Editorial Guild',
        description: bundle.description,
        priceInInr: bundle.priceInInr,
        originalPriceInInr: bundle.originalPriceInInr,
        pages: bundle.bookCount * 180,
        format: 'PDF',
        fileSize: '180 MB',
        category: bundle.category,
        coverImage: '/covers/bundle-developer.png',
        fileName: `${bundle.slug}.zip`,
        status: 'PUBLISHED' as const,
        rating: 5,
        reviewCount: 0,
        readingTime: '24 hours',
        edition: '1st Edition',
        sampleExcerpt: [],
        tableOfContents: bundle.includedTitles
      };
      onSelectBuy(bundleBookItem as Book);
    }
  };

  return (
    <section id="bundles" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs font-medium text-[#81796D] mb-2">
            <Layers className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Curated Reader Bundles</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight">
            Comprehensive Topic Vaults
          </h2>
          <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
            Hand-curated collections of textbooks and manuals grouped by syllabus and professional track. Save up to 70%.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CURATED_BUNDLES.map((bundle) => {
          const savings = Math.round(
            ((bundle.originalPriceInInr - bundle.priceInInr) / bundle.originalPriceInInr) * 100
          );
          const displayPrice = currency === 'INR' ? `₹${bundle.priceInInr}` : `$${(bundle.priceInInr / 85).toFixed(2)}`;
          const displayOriginal = currency === 'INR' ? `₹${bundle.originalPriceInInr}` : `$${(bundle.originalPriceInInr / 85).toFixed(2)}`;

          return (
            <div
              key={bundle.id}
              className="bg-white border border-[#E8E4DC] hover:border-[#D5CEBE] rounded-xl p-6 flex flex-col justify-between shadow-book hover:shadow-book-hover transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC]">
                    {bundle.badge}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#81796D]">
                    {bundle.bookCount} Editions
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#24231F] leading-snug mb-2">
                  {bundle.title}
                </h3>
                <p className="text-xs text-[#6E685F] line-clamp-2 leading-relaxed mb-4">
                  {bundle.description}
                </p>

                <div className="border-t border-[#E8E4DC] pt-3 pb-4 space-y-2">
                  <span className="text-[11px] font-semibold text-[#24231F] block">Curated Highlights:</span>
                  <ul className="space-y-1.5 text-xs text-[#5B5449]">
                    {bundle.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E4DC] space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-xl font-bold text-[#24231F]">{displayPrice}</span>
                    <span className="text-xs text-[#81796D] line-through">{displayOriginal}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#835C3A] bg-[#FAF6F1] px-2 py-0.5 rounded border border-[#F2E8DC]">
                    Save {savings}%
                  </span>
                </div>

                <button
                  onClick={() => handleBuyBundle(bundle)}
                  className="w-full py-2.5 px-4 bg-[#24231F] hover:bg-[#3D3B35] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Get Complete Bundle</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
