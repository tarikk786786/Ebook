'use client';

import React from 'react';
import { Book } from '@/lib/catalog';
import { X, BookOpen, CheckCircle, Zap } from 'lucide-react';

interface PreviewModalProps {
  book: Book | null;
  onClose: () => void;
  onBuy: (book: Book) => void;
}

export default function PreviewModal({ book, onClose, onBuy }: PreviewModalProps) {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#121826] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-[#0B0F17]/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                {book.category}
              </span>
              <span className="text-xs text-slate-400">{book.format} • {book.pages} Pages</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">{book.title}</h2>
            <p className="text-xs text-slate-400">By {book.author}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 font-mono">
              About This Volume
            </h4>
            <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
              {book.description}
            </p>
          </div>

          {/* Sample Excerpt */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 font-mono">
              Sample Excerpt (Chapter 1)
            </h4>
            <div className="space-y-3 bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-slate-300 font-serif leading-relaxed text-sm italic">
              {book.sampleExcerpt.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 font-mono">
              Table of Contents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {book.tableOfContents.map((chapter, i) => (
                <div key={i} className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{chapter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F17]/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white font-mono">₹{book.priceInInr}</span>
              <span className="text-xs text-slate-500 line-through">₹{book.originalPriceInInr}</span>
            </div>
            <p className="text-[10px] text-slate-400">Zero-Trace Encrypted Delivery</p>
          </div>

          <button
            onClick={() => {
              onClose();
              onBuy(book);
            }}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Instant Buy with UPI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
