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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-4xl h-[90vh] bg-[#FAF8F5] border border-[#E8E4DC] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="px-6 py-4 border-b border-[#E8E4DC] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded-lg bg-[#FAF6F1] border border-[#F2E8DC] text-[#9A704B] shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="font-serif text-sm font-bold text-[#24231F] truncate">{book.title}</h2>
              <p className="text-xs text-[#81796D]">Sample Reader • {book.author}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Typography Controls */}
            <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-xs">
              <button
                onClick={() => setFontFamily('serif')}
                className={`px-2 py-0.5 rounded font-serif text-xs transition-colors ${fontFamily === 'serif' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily('sans')}
                className={`px-2 py-0.5 rounded font-sans text-xs transition-colors ${fontFamily === 'sans' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily('mono')}
                className={`px-2 py-0.5 rounded font-mono text-xs transition-colors ${fontFamily === 'mono' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                Mono
              </button>
            </div>

            {/* Font Size */}
            <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] text-xs">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-white text-[#24231F] font-bold shadow-sm' : 'text-[#81796D]'}`}
              >
                A+
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-[#81796D] hover:text-[#24231F] hover:bg-[#FAF8F5] rounded-lg transition-colors"
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Layout: Sidebar + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table of Contents Sidebar */}
          <aside className="w-64 border-r border-[#E8E4DC] bg-white p-4 hidden md:flex flex-col justify-between overflow-y-auto">
            <div>
              <span className="text-[10px] uppercase font-sans tracking-wider text-[#81796D] font-semibold block mb-3">
                Table of Contents
              </span>
              <ul className="space-y-1">
                {chapters.map((ch, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        activeChapterIndex === idx 
                          ? 'bg-[#FAF6F1] text-[#9A704B] font-semibold border border-[#F2E8DC]' 
                          : 'text-[#6E685F] hover:bg-[#FAF8F5] hover:text-[#24231F]'
                      }`}
                    >
                      <span className="truncate">{ch}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-[#9A704B] border border-[#E8E4DC]">
                          Free
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade CTA in Sidebar */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC] space-y-2 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A704B]">Full Edition</span>
              <p className="text-xs text-[#6E685F]">
                Get all {book.pages} pages with permanent DRM-free PDF download.
              </p>
              <button
                onClick={() => onBuy(book)}
                className="w-full py-2 bg-[#24231F] hover:bg-[#3D3B35] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buy Full Edition (₹{book.priceInInr})</span>
              </button>
            </div>
          </aside>

          {/* Reading Canvas */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#FAF8F5]">
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-2xl mx-auto w-full">
              {book.fileName && book.fileName.endsWith('.pdf') ? (
                <PdfReaderView
                  book={book}
                  activeChapterIndex={activeChapterIndex}
                  onSelectChapter={setActiveChapterIndex}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                />
              ) : (
                <article 
                  className={`space-y-6 leading-relaxed text-[#24231F] ${
                    fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'
                  } ${fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'}`}
                >
                  <div className="border-b border-[#E8E4DC] pb-4">
                    <span className="text-xs uppercase font-sans tracking-wider text-[#81796D]">
                      Chapter {activeChapterIndex + 1}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 text-[#24231F]">
                      {chapters[activeChapterIndex]}
                    </h3>
                  </div>

                  <p className="text-[#3D3B35] leading-relaxed">
                    {book.description || 'Welcome to this digital edition. The full textbook covers end-to-end architectures, hands-on production code samples, and benchmarked performance patterns.'}
                  </p>

                  <div className="p-6 rounded-xl bg-white border border-[#E8E4DC] text-center space-y-3 my-8 shadow-book">
                    <BookOpen className="w-8 h-8 text-[#9A704B] mx-auto" />
                    <h4 className="font-serif text-base font-bold text-[#24231F]">End of Free Preview Chapter</h4>
                    <p className="text-xs text-[#6E685F] max-w-sm mx-auto">
                      Unlock the remaining {book.pages - 15 > 0 ? book.pages - 15 : book.pages} pages with instant PDF download and cloud reader access.
                    </p>
                    <button
                      onClick={() => onBuy(book)}
                      className="px-6 py-2.5 bg-[#24231F] hover:bg-[#3D3B35] text-white font-medium text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Unlock Complete Book for ₹{book.priceInInr}</span>
                    </button>
                  </div>
                </article>
              )}
            </div>

            {/* Bottom Chapter Pager */}
            <div className="px-6 py-3 border-t border-[#E8E4DC] bg-white flex items-center justify-between text-xs text-[#6E685F]">
              <button
                disabled={activeChapterIndex === 0}
                onClick={() => setActiveChapterIndex(p => Math.max(0, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#E8E4DC] hover:bg-[#FAF8F5] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Chapter</span>
              </button>

              <span className="font-mono text-xs">
                {activeChapterIndex + 1} of {chapters.length}
              </span>

              <button
                disabled={activeChapterIndex >= chapters.length - 1}
                onClick={() => setActiveChapterIndex(p => Math.min(chapters.length - 1, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#E8E4DC] hover:bg-[#FAF8F5] disabled:opacity-40 transition-colors"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
