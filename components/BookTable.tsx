'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import AvailabilityBadge from '@/components/AvailabilityBadge';
import { 
  BookOpen, 
  Bookmark, 
  Layers, 
  FileText, 
  Cpu, 
  Zap, 
  FileSpreadsheet, 
  Eye, 
  ExternalLink 
} from 'lucide-react';

interface BookTableProps {
  books: Book[];
  currency?: 'INR' | 'USD';
  onSelectBuy: (book: Book) => void;
  onSelectPreview: (book: Book) => void;
}

export default function BookTable({
  books,
  currency = 'INR',
  onSelectBuy,
  onSelectPreview,
}: BookTableProps) {
  const typeConfig: Record<string, { label: string; badgeCls: string; icon: any }> = {
    published_ebook: { label: 'Published Book', badgeCls: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', icon: BookOpen },
    textbook: { label: 'Textbook', badgeCls: 'bg-amber-950/80 text-amber-300 border-amber-500/40', icon: Bookmark },
    professional_book: { label: 'Professional Book', badgeCls: 'bg-blue-950/80 text-blue-300 border-blue-500/40', icon: BookOpen },
    course_material: { label: 'Course Material', badgeCls: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40', icon: Layers },
    lecture_notes: { label: 'Lecture Notes', badgeCls: 'bg-orange-950/80 text-orange-300 border-orange-500/40', icon: FileText },
    study_notes: { label: 'Study Notes', badgeCls: 'bg-orange-950/80 text-orange-300 border-orange-500/40', icon: FileText },
    exam_preparation: { label: 'Exam Prep', badgeCls: 'bg-rose-950/80 text-rose-300 border-rose-500/40', icon: FileText },
    technical_manual: { label: 'Manual', badgeCls: 'bg-purple-950/80 text-purple-300 border-purple-500/40', icon: Cpu },
    cheat_sheet: { label: 'Cheat Sheet', badgeCls: 'bg-teal-950/80 text-teal-300 border-teal-500/40', icon: Zap },
    template: { label: 'Template', badgeCls: 'bg-pink-950/80 text-pink-300 border-pink-500/40', icon: FileSpreadsheet },
    research_paper: { label: 'Paper', badgeCls: 'bg-teal-950/80 text-teal-300 border-teal-500/40', icon: FileText },
  };

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
            <tr>
              <th className="py-3 px-4">Title & Details</th>
              <th className="py-3 px-4 hidden md:table-cell">Author</th>
              <th className="py-3 px-4 hidden sm:table-cell">Type & Category</th>
              <th className="py-3 px-4 hidden lg:table-cell">Specs</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {books.map((book) => {
              const resType = book.primaryResourceType || 'course_material';
              const currentType = typeConfig[resType] || {
                label: 'Verified Doc',
                badgeCls: 'bg-slate-900 text-slate-300 border-slate-700',
                icon: FileText,
              };
              const TypeIcon = currentType.icon;

              const displayPrice = currency === 'INR'
                ? `₹${book.priceInInr}`
                : `$${(book.priceInInr / 85).toFixed(2)}`;

              const displayOriginalPrice = currency === 'INR'
                ? `₹${book.originalPriceInInr}`
                : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

              return (
                <tr 
                  key={book.id} 
                  className="hover:bg-slate-900/60 transition-colors group"
                >
                  {/* Book Thumbnail & Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3 max-w-sm sm:max-w-md">
                      <div className="relative w-9 h-12 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0 shadow-sm group-hover:border-emerald-500/50 transition-colors">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/book/${book.slug}`}
                          className="font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 block text-xs sm:text-sm"
                        >
                          {book.title}
                        </Link>
                        {book.subtitle && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 hidden sm:block mt-0.5">
                            {book.subtitle}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-500 block md:hidden mt-0.5">
                          By {book.author}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="py-3 px-4 hidden md:table-cell text-slate-300 text-xs">
                    <span className="line-clamp-1">{book.author}</span>
                    {book.publisher && (
                      <span className="text-[10px] text-slate-500 block line-clamp-1">
                        {book.publisher}
                      </span>
                    )}
                  </td>

                  {/* Type & Category */}
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-md flex items-center space-x-1 ${currentType.badgeCls}`}>
                          <TypeIcon className="w-2.5 h-2.5" />
                          <span>{currentType.label}</span>
                        </span>
                        <AvailabilityBadge book={book} size="sm" />
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1">
                        {book.category}
                      </span>
                    </div>
                  </td>

                  {/* Specs */}
                  <td className="py-3 px-4 hidden lg:table-cell text-slate-400 font-mono text-[11px]">
                    <div>{book.pages} Pages</div>
                    <div className="text-[10px] text-slate-500">{book.format} • {book.fileSize}</div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4">
                    <div className="font-mono">
                      <span className="text-emerald-400 font-bold text-sm">{displayPrice}</span>
                      <span className="text-slate-500 text-[10px] line-through ml-1.5 hidden sm:inline">
                        {displayOriginalPrice}
                      </span>
                    </div>
                    <span className="text-[9px] text-amber-400 font-mono font-bold block sm:hidden">
                      {Math.round(((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100)}% OFF
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onSelectPreview(book)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                        title="Look Inside Sample"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectBuy(book)}
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-sm active:scale-95 transition-all"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Get</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
