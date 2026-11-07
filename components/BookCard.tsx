'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import { BookOpen, Star, Clock, FileText, Zap, Eye, Download, ExternalLink } from 'lucide-react';

interface BookCardProps {
  book: Book;
  currency?: 'INR' | 'USD';
  onSelectBuy: (book: Book) => void;
  onSelectPreview: (book: Book) => void;
}

export default function BookCard({ book, currency = 'INR', onSelectBuy, onSelectPreview }: BookCardProps) {
  const [imgError, setImgError] = React.useState(false);

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
    <div className="group relative bg-[#121826] border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between">
      {/* 3D Vertical Book Jacket Mockup */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 shadow-xl mb-4 group-hover:-translate-y-1 transition-transform duration-300">
        {/* Book Cover Image with Fallback */}
        {!imgError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-between p-4 border border-slate-700/50">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Digital Edition</span>
            </div>
            <div className="my-auto">
              <h5 className="text-sm font-black text-white line-clamp-3 leading-snug">{book.title}</h5>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">By {book.author}</p>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono font-medium">
              {book.pages} Pages • DRM-Free
            </div>
          </div>
        )}

        {/* 3D Realistic Spine Shadow & Book Highlight */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-3 w-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-transparent to-black/20 pointer-events-none" />

        {/* Floating Category & Bestseller Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 rounded-md">
            {book.category}
          </span>
          {book.badge && (
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-md">
              {book.badge}
            </span>
          )}
        </div>

        {/* Overlay Book Spine Title Preview */}
        <div className="absolute bottom-2.5 left-3 right-3 text-left pointer-events-none">
          <span className="text-[10px] text-emerald-400 font-mono block font-semibold">{book.edition}</span>
          <h4 className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">{book.title}</h4>
        </div>
      </div>

      {/* Book Metadata & Editorial Info */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Star Rating & Reading Time */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <div className="flex items-center space-x-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <span className="font-semibold text-slate-200">{book.rating}</span>
              <span className="text-slate-500">({book.reviewCount})</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{book.readingTime}</span>
            </div>
          </div>

          {/* Book Title & Byline */}
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            By <span className="text-slate-300 font-medium">{book.author}</span>
          </p>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {book.description}
          </p>

          {/* Formats Pill */}
          <div className="mt-3 flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {book.format}
            </span>
            <span>•</span>
            <span>{book.pages} Pages</span>
            <span>•</span>
            <span>{book.fileSize}</span>
          </div>
        </div>

        {/* Pricing & Purchase Actions */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-black text-white font-mono">
                  {displayPrice}
                </span>
                <span className="text-xs text-slate-500 line-through">
                  {displayOriginalPrice}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                Save {discountPercent}% • 0% Fee UPI
              </span>
            </div>

            <span className="text-[10px] text-slate-400 text-right">
              Instant Delivery<br />
              <strong className="text-slate-300 font-mono">Kindle & iPad Ready</strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectPreview(book)}
              className="w-full py-2 px-2.5 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Look Inside</span>
            </button>

            <button
              onClick={() => onSelectBuy(book)}
              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy eBook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
