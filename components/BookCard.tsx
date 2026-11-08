'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import AvailabilityBadge from '@/components/AvailabilityBadge';
import { 
  BookOpen, 
  Star, 
  Clock, 
  FileText, 
  Zap, 
  Eye, 
  ShoppingBag,
  Bookmark,
  Layers,
  Cpu,
  FileSpreadsheet
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

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  const resType = book.primaryResourceType || 'course_material';

  const typeConfig: Record<string, { label: string; icon: any }> = {
    published_ebook: { label: 'Book', icon: BookOpen },
    textbook: { label: 'Textbook', icon: Bookmark },
    professional_book: { label: 'Manual', icon: BookOpen },
    course_material: { label: 'Course', icon: Layers },
    lecture_notes: { label: 'Notes', icon: FileText },
    study_notes: { label: 'Notes', icon: FileText },
    exam_preparation: { label: 'Exam', icon: FileText },
    technical_manual: { label: 'Technical', icon: Cpu },
    cheat_sheet: { label: 'Cheat Sheet', icon: Zap },
    template: { label: 'Template', icon: FileSpreadsheet },
    research_paper: { label: 'Paper', icon: FileText },
    culinary_guide: { label: 'Culinary', icon: Bookmark },
    code_template: { label: 'Code', icon: Cpu },
    workbook: { label: 'Workbook', icon: FileSpreadsheet },
  };

  const currentType = typeConfig[resType] || { label: 'Doc', icon: FileText };
  const TypeIcon = currentType.icon;

  return (
    <div className="group bg-[#111622] border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 transition-colors flex flex-col justify-between">
      {/* Book Jacket Thumbnail */}
      <Link href={`/book/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full rounded-md overflow-hidden bg-slate-900 border border-slate-800/80 mb-3">
          {!imgError ? (
            <img
              src={book.coverImage}
              alt={book.title}
              onError={() => setImgError(true)}
              loading="lazy"
              className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-[#0B0F17] flex flex-col justify-between p-3 border border-slate-800">
              <div className="flex items-center space-x-1 text-slate-400">
                <TypeIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase">{currentType.label}</span>
              </div>
              <div className="my-auto">
                <h5 className="text-xs font-semibold text-white line-clamp-3 leading-snug">{book.title}</h5>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{book.author}</p>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {book.pages} Pages • PDF
              </div>
            </div>
          )}

          {/* Clean Floating Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide bg-slate-950/90 text-slate-300 border border-slate-800 rounded">
              {currentType.label}
            </span>
            <AvailabilityBadge book={book} size="sm" />
          </div>
        </div>
      </Link>

      {/* Book Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Reading Time */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-200">{book.rating}</span>
              <span className="text-slate-500">({book.reviewCount})</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{book.readingTime}</span>
            </div>
          </div>

          {/* Title & Author */}
          <Link href={`/book/${book.slug}`} className="block">
            <h3 className="text-sm font-semibold text-white group-hover:text-slate-200 transition-colors line-clamp-1">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {book.author}
          </p>

          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {book.description}
          </p>

          {/* Specs */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span>{book.format}</span>
            <span>•</span>
            <span>{book.pages} pgs</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">{book.category}</span>
          </div>
        </div>

        {/* Pricing & Purchase Actions */}
        <div className="pt-2.5 border-t border-slate-800/80 mt-3">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-white font-mono">
                {displayPrice}
              </span>
              <span className="text-xs text-slate-500 line-through">
                {displayOriginalPrice}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              FamPay UPI • 0% Fee
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-12 gap-1.5">
            <button
              onClick={() => onSelectPreview(book)}
              className="col-span-3 py-1.5 px-1 rounded-md border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center transition-colors"
              title="Look Inside Sample"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => addToCart(book)}
              className={`col-span-4 py-1.5 px-2 rounded-md border text-xs font-medium flex items-center justify-center space-x-1 transition-colors ${
                isInCart 
                  ? 'bg-slate-800 border-slate-600 text-white' 
                  : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Add to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>{isInCart ? 'In Cart' : '+ Cart'}</span>
            </button>

            <button
              onClick={() => onSelectBuy(book)}
              className="col-span-5 py-1.5 px-2 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors active:scale-[0.99]"
            >
              <span>Get</span>
              <span className="font-mono">{displayPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
