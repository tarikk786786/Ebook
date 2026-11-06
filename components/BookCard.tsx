'use client';

import React from 'react';
import { Book } from '@/lib/catalog';
import { BookOpen, FileText, DownloadCloud, Zap, Eye, CheckCircle2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  currency?: 'INR' | 'USD';
  onSelectBuy: (book: Book) => void;
  onSelectPreview: (book: Book) => void;
}

export default function BookCard({ book, currency = 'INR', onSelectBuy, onSelectPreview }: BookCardProps) {
  const discountPercent = Math.round(
    ((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100
  );

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  return (
    <div className="group relative bg-[#121826] border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col justify-between">
      {/* Top Banner & Image with subtle dark gradient overlay */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase bg-[#0B0F17]/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-lg">
            {book.category}
          </span>
          {book.badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500 text-slate-950 rounded-md">
              {book.badge}
            </span>
          )}
        </div>

        {/* Format Tag */}
        <div className="absolute bottom-2 right-3 text-[11px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
          {book.format} • {book.fileSize}
        </div>
      </div>

      {/* Book Metadata */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {book.subtitle}
          </p>

          <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white font-mono">
                  {displayPrice}
                </span>
                <span className="text-xs text-slate-500 line-through">
                  {displayOriginalPrice}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                  {discountPercent}% OFF
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Direct 0% UPI • Instant Stream</span>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span className="block font-medium text-slate-300">{book.pages} Pages</span>
              <span className="text-[10px] text-slate-500">AES-256 Verified</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectPreview(book)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Read Sample</span>
            </button>

            <button
              onClick={() => onSelectBuy(book)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Instant Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
