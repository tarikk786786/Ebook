'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Sun, 
  Moon, 
  Coffee, 
  List, 
  ShieldCheck, 
  Download 
} from 'lucide-react';

interface EpubReaderProps {
  title: string;
  author: string;
  streamUrl: string;
  watermarkText?: string;
  allowDownload?: boolean;
  onClose?: () => void;
  onProgressUpdate?: (chapter: number, total: number) => void;
}

type ThemeMode = 'DARK' | 'SEPIA' | 'LIGHT';

export default function EpubReader({
  title,
  author,
  streamUrl,
  watermarkText = 'Licensed Personal Copy',
  allowDownload = true,
  onClose,
  onProgressUpdate,
}: EpubReaderProps) {
  const [currentChapter, setCurrentChapter] = useState(1);
  const totalChapters = 12; // Dynamic when parsed
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<ThemeMode>('DARK');
  const [isTocOpen, setIsTocOpen] = useState(false);

  const themeStyles: Record<ThemeMode, { bg: string; text: string; headerBg: string; border: string }> = {
    DARK: {
      bg: 'bg-[#0A0E17]',
      text: 'text-slate-200',
      headerBg: 'bg-[#0D121D]',
      border: 'border-slate-800',
    },
    SEPIA: {
      bg: 'bg-[#FBF0D9]',
      text: 'text-[#433422]',
      headerBg: 'bg-[#F4E3C1]',
      border: 'border-[#E2CEAA]',
    },
    LIGHT: {
      bg: 'bg-[#FAFAFA]',
      text: 'text-slate-800',
      headerBg: 'bg-white',
      border: 'border-slate-200',
    },
  };

  const activeTheme = themeStyles[theme];

  const handleNextChapter = () => {
    setCurrentChapter((c) => {
      const next = Math.min(totalChapters, c + 1);
      onProgressUpdate?.(next, totalChapters);
      return next;
    });
  };

  const handlePrevChapter = () => {
    setCurrentChapter((c) => {
      const prev = Math.max(1, c - 1);
      onProgressUpdate?.(prev, totalChapters);
      return prev;
    });
  };

  return (
    <div className={`flex flex-col h-screen ${activeTheme.bg} ${activeTheme.text} transition-colors duration-200 select-none overflow-hidden`}>
      {/* Top Controls Header */}
      <header className={`h-14 border-b ${activeTheme.border} ${activeTheme.headerBg} px-4 flex items-center justify-between shrink-0 shadow-sm`}>
        <div className="flex items-center space-x-3 truncate mr-4">
          <BookOpen className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-bold truncate">{title}</h4>
            <p className="text-[10px] opacity-70 truncate">By {author} • EPUB Flow Reader</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Table of Contents toggle */}
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="p-2 rounded-lg border border-current opacity-70 hover:opacity-100 transition-opacity text-xs flex items-center space-x-1"
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">TOC</span>
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center border border-current rounded-lg p-0.5 opacity-80 text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              className="px-2 py-1 hover:opacity-100 font-bold"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 2))}
              className="px-2 py-1 hover:opacity-100 font-bold"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Theme Palette Switcher */}
          <div className="flex items-center border border-current rounded-lg p-0.5 opacity-80">
            <button
              onClick={() => setTheme('DARK')}
              className={`p-1.5 rounded ${theme === 'DARK' ? 'bg-emerald-500 text-slate-950 font-bold' : ''}`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('SEPIA')}
              className={`p-1.5 rounded ${theme === 'SEPIA' ? 'bg-amber-600 text-white font-bold' : ''}`}
              title="Sepia Mode"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('LIGHT')}
              className={`p-1.5 rounded ${theme === 'LIGHT' ? 'bg-slate-300 text-slate-950 font-bold' : ''}`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Optional Download */}
          {allowDownload && (
            <a
              href={streamUrl}
              download
              className="p-2 rounded-lg border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              title="Download EPUB File"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-current opacity-80 hover:opacity-100 text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </header>

      {/* Main Chapter Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 flex justify-center">
        <div className="max-w-2xl w-full space-y-6" style={{ fontSize: `${fontSize}px` }}>
          {/* Subtle Dynamic Watermark */}
          <div className="text-[10px] font-mono opacity-40 text-center border-b border-current pb-2">
            {watermarkText} • AnonTrove Authorized Flow Stream
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Chapter {currentChapter}: Essential Foundations & Strategy
          </h2>

          <p className="leading-relaxed opacity-90">
            Digital ownership represents a fundamental evolution in software and publication economics. When educational and technical materials are decoupled from predatory subscription platforms, self-directed learners gain permanent, uninterrupted access to foundational knowledge.
          </p>

          <p className="leading-relaxed opacity-90">
            In this section, we examine the cryptographic primitives underpinning zero-trace digital distribution. By combining timing-safe message authentication codes with client-side canvas watermarking, authors and creators can distribute intellectual property openly while discouraging unauthorized public mirroring.
          </p>

          <div className="p-4 rounded-xl border border-current opacity-80 my-4 text-xs font-mono">
            Key Architecture Takeaway: Zero-knowledge licensing requires non-custodial fulfillment where the merchant acts purely as an ephemeral settlement router, never retaining consumer identity tokens on third-party servers.
          </div>

          <p className="leading-relaxed opacity-90">
            Modern e-reader engines leverage modular web components to maintain responsive typographic rhythms across diverse device viewports. Whether inspected on an ultra-wide desktop canvas or a pocket-sized mobile screen, fluid text flow ensures optimal legibility and engagement.
          </p>
        </div>
      </div>

      {/* Chapter Footer Navigation */}
      <footer className={`h-12 border-t ${activeTheme.border} ${activeTheme.headerBg} px-4 flex items-center justify-between shrink-0 text-xs`}>
        <button
          onClick={handlePrevChapter}
          disabled={currentChapter <= 1}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-current opacity-80 disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="font-mono text-xs opacity-80">
          Chapter {currentChapter} of {totalChapters}
        </span>

        <button
          onClick={handleNextChapter}
          disabled={currentChapter >= totalChapters}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-current opacity-80 disabled:opacity-30"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
}
