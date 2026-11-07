'use client';

import React, { useState } from 'react';
import { Book } from '@/lib/catalog';
import { X, ChevronLeft, ChevronRight, BookOpen, Zap, Type, AlignLeft } from 'lucide-react';
import PdfReaderView from './PdfReaderView';

interface ReaderModalProps {
  book: Book | null;
  onClose: () => void;
  onBuy: (book: Book) => void;
}

export default function ReaderModal({ book, onClose, onBuy }: ReaderModalProps) {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');

  if (!book) return null;

  const chapters = book.tableOfContents && book.tableOfContents.length > 0 
    ? book.tableOfContents 
    : ['1. Foundational Overview', '2. Core Principles & Frameworks', '3. Practical Applications'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl h-[90vh] bg-[#0E131F] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F17]">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-semibold text-white truncate">{book.title}</h2>
              <p className="text-xs text-slate-400">Sample Reader • {book.author}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Typography Controls */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setFontFamily('serif')}
                className={`px-2 py-0.5 rounded font-serif text-xs ${fontFamily === 'serif' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily('sans')}
                className={`px-2 py-0.5 rounded font-sans text-xs ${fontFamily === 'sans' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily('mono')}
                className={`px-2 py-0.5 rounded font-mono text-xs ${fontFamily === 'mono' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                Mono
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={() => setFontSize(fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : 'sm')}
                className="px-2 py-0.5 text-slate-300 font-mono text-xs hover:text-white"
                title="Toggle font size"
              >
                {fontSize.toUpperCase()}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table of Contents Sidebar */}
          <div className="hidden md:block w-72 border-r border-slate-800/80 bg-[#0B0F17]/50 p-4 overflow-y-auto">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-3">
              Table of Contents
            </span>
            <div className="space-y-1">
              {chapters.map((chap, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors truncate block ${
                    activeChapterIndex === idx
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {chap}
                </button>
              ))}
            </div>

            <div className="mt-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-300 font-semibold block mb-1">Full Edition Includes:</span>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                <li>{book.pages} Complete Pages</li>
                <li>Searchable & Printable DRM-Free PDF</li>
                <li>Code snippets & architecture diagrams</li>
                <li>Free lifetime revision updates</li>
              </ul>
            </div>
          </div>

          {/* Fault-Tolerant Reading View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <PdfReaderView
              book={book}
              activeChapterIndex={activeChapterIndex}
              onSelectChapter={setActiveChapterIndex}
              fontFamily={fontFamily}
              fontSize={fontSize}
            />

            {/* Bottom Chapter Pagination */}
            <div className="px-6 py-3 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => setActiveChapterIndex(Math.max(0, activeChapterIndex - 1))}
                disabled={activeChapterIndex === 0}
                className="flex items-center space-x-1 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Section</span>
              </button>

              <span className="font-mono text-slate-500">
                {activeChapterIndex + 1} / {chapters.length}
              </span>

              <button
                onClick={() => setActiveChapterIndex(Math.min(chapters.length - 1, activeChapterIndex + 1))}
                disabled={activeChapterIndex === chapters.length - 1}
                className="flex items-center space-x-1 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Purchase Footer */}
        <div className="px-6 py-4 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white font-mono">₹{book.priceInInr}</span>
            <span className="text-xs text-slate-500 line-through">₹{book.originalPriceInInr}</span>
            <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded">
              Direct UPI • Single-Use Encrypted Token
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onBuy(book);
            }}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Buy Full Edition with UPI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
