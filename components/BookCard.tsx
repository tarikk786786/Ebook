'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import { 
  BookOpen, 
  Star, 
  Clock, 
  FileText, 
  Zap, 
  Eye, 
  Download, 
  Tag, 
  CheckCircle2, 
  Bookmark, 
  Layers, 
  Cpu, 
  FileSpreadsheet,
  ShoppingBag
} from 'lucide-react';

interface BookCardProps {
  book: Book;
  currency?: 'INR' | 'USD';
  onSelectBuy: (book: Book) => void;
  onSelectPreview: (book: Book) => void;
}

export default function BookCard({ book, currency = 'INR', onSelectBuy, onSelectPreview }: BookCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);

  const discountPercent = Math.max(
    65,
    Math.round(((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100)
  );

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  // Determine human-readable resource type & visual theme
  const resType = book.primaryResourceType || 'course_material';

  const typeConfig: Record<string, { label: string; badgeCls: string; icon: any }> = {
    published_ebook: { label: 'Published E-Book', badgeCls: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50', icon: BookOpen },
    textbook: { label: 'Textbook', badgeCls: 'bg-amber-950/90 text-amber-300 border-amber-500/50', icon: Bookmark },
    professional_book: { label: 'Professional Book', badgeCls: 'bg-blue-950/90 text-blue-300 border-blue-500/50', icon: BookOpen },
    course_material: { label: 'Course Material', badgeCls: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50', icon: Layers },
    lecture_notes: { label: 'Lecture Notes', badgeCls: 'bg-orange-950/90 text-orange-300 border-orange-500/50', icon: FileText },
    study_notes: { label: 'Study Notes', badgeCls: 'bg-orange-950/90 text-orange-300 border-orange-500/50', icon: FileText },
    exam_preparation: { label: 'Exam Prep', badgeCls: 'bg-rose-950/90 text-rose-300 border-rose-500/50', icon: FileText },
    technical_manual: { label: 'Technical Manual', badgeCls: 'bg-purple-950/90 text-purple-300 border-purple-500/50', icon: Cpu },
    cheat_sheet: { label: 'Cheat Sheet', badgeCls: 'bg-teal-950/90 text-teal-300 border-teal-500/50', icon: Zap },
    template: { label: 'Template / Form', badgeCls: 'bg-pink-950/90 text-pink-300 border-pink-500/50', icon: FileSpreadsheet },
    research_paper: { label: 'Research Paper', badgeCls: 'bg-teal-950/90 text-teal-300 border-teal-500/50', icon: FileText },
    culinary_guide: { label: 'MasterClass Culinary', badgeCls: 'bg-orange-950/90 text-orange-300 border-orange-500/50', icon: Bookmark },
    code_template: { label: 'Code & Dev Assets', badgeCls: 'bg-sky-950/90 text-sky-300 border-sky-500/50', icon: Cpu },
    workbook: { label: 'Action Workbook', badgeCls: 'bg-pink-950/90 text-pink-300 border-pink-500/50', icon: FileSpreadsheet },
  };

  const currentType = typeConfig[resType] || { label: 'Verified Document', badgeCls: 'bg-slate-900 text-slate-300 border-slate-700', icon: FileText };
  const TypeIcon = currentType.icon;

  return (
    <div className="group relative bg-[#111724] border border-slate-800/90 hover:border-emerald-500/60 rounded-2xl p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between">
      {/* 3D Vertical Book Jacket Mockup */}
      <Link href={`/book/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-900 shadow-xl mb-4 group-hover:-translate-y-1 transition-transform duration-300">
          {/* Cover Image with Fallback */}
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
                <TypeIcon className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">{currentType.label}</span>
              </div>
              <div className="my-auto">
                <h5 className="text-sm font-black text-white line-clamp-3 leading-snug">{book.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">By {book.author}</p>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono font-medium">
                {book.pages} Pages • DRM-Free PDF
              </div>
            </div>
          )}

          {/* 3D Realistic Spine Shadow & Book Highlight */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-3 w-[1px] bg-white/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-1">
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border rounded-md flex items-center space-x-1 ${currentType.badgeCls}`}>
              <TypeIcon className="w-2.5 h-2.5" />
              <span>{currentType.label}</span>
            </span>
            
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-md shrink-0">
              -{discountPercent}%
            </span>
          </div>
        </div>
      </Link>

      {/* Book Metadata Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Reading Time */}
          <div className="flex items-center justify-between text-xs mb-2">
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

          {/* Title & Author */}
          <Link href={`/book/${book.slug}`} className="block group">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            By <span className="text-slate-300 font-medium">{book.author}</span>
          </p>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {book.description}
          </p>

          {/* Specs */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {book.format}
            </span>
            <span>•</span>
            <span>{book.pages} Pages</span>
            <span>•</span>
            <span>{book.fileSize}</span>
            <span>•</span>
            <span className="text-emerald-400/90">{book.category}</span>
          </div>
        </div>

        {/* Pricing & Purchase Actions */}
        <div className="pt-3 border-t border-slate-800/80 mt-3">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {displayPrice}
                </span>
                <span className="text-xs text-slate-500 line-through">
                  {displayOriginalPrice}
                </span>
              </div>
              <span className="text-[10px] text-emerald-300 font-medium flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Instant Razorpay & UPI Checkout</span>
              </span>
            </div>

            <span className="text-[10px] text-slate-400 text-right leading-tight">
              DRM-Free<br />
              <strong className="text-slate-300 font-mono">Kindle/iPad Ready</strong>
            </span>
          </div>

          {/* Action Buttons: Look Inside, Add to Cart, Buy Now */}
          <div className="grid grid-cols-12 gap-1.5">
            <button
              onClick={() => onSelectPreview(book)}
              className="col-span-3 py-2 px-1 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center transition-colors"
              title="Look Inside Sample"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => addToCart(book)}
              className={`col-span-4 py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                isInCart 
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Add to Multi-Item Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isInCart ? 'In Cart' : '+ Cart'}</span>
            </button>

            <button
              onClick={() => onSelectBuy(book)}
              className="col-span-5 py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy {displayPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
