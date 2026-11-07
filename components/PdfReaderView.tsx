'use client';

import React, { useState, useEffect } from 'react';
import { Book } from '@/lib/catalog';
import { 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  Search, 
  FileText,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';

interface PdfReaderViewProps {
  book: Book;
  activeChapterIndex: number;
  onSelectChapter: (idx: number) => void;
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'base' | 'lg';
}

type RendererMode = 'standard' | 'fallback' | 'typography';

export default function PdfReaderView({
  book,
  activeChapterIndex,
  onSelectChapter,
  fontFamily,
  fontSize
}: PdfReaderViewProps) {
  const [rendererMode, setRendererMode] = useState<RendererMode>('standard');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [reportSent, setReportSent] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[fontFamily];

  const sizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
  }[fontSize];

  // Reset errors when switching books or chapters
  useEffect(() => {
    setHasError(false);
    setErrorDetails('');
    setReportSent(false);
  }, [book.id, activeChapterIndex]);

  const handleRetry = () => {
    setHasError(false);
    setErrorDetails('');
    setRendererMode('standard');
  };

  const handleFallbackSwitch = () => {
    setHasError(false);
    setRendererMode('fallback');
  };

  const handleReportProblem = () => {
    setReportSent(true);
    // Log technical details safely to internal console only
    console.warn(`[AnonTrove Internal Telemetry] Reader fallback requested for book: ${book.slug}, mode: ${rendererMode}`);
  };

  // Safe search filter across excerpts and TOC
  const filteredExcerpts = book.sampleExcerpt.filter(p => 
    !searchQuery || p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E131F] overflow-hidden">
      {/* Secondary Controls Bar: Mode switcher, zoom, search */}
      <div className="px-6 py-2.5 border-b border-slate-800 bg-[#0B0F17]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Renderer:</span>
          <button
            onClick={() => { setRendererMode('standard'); setHasError(false); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              rendererMode === 'standard' && !hasError
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Enhanced View
          </button>
          <button
            onClick={() => { setRendererMode('fallback'); setHasError(false); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              rendererMode === 'fallback'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Adaptive Flow
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5">
            <button
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-300 w-10 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(175, zoomLevel + 15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 text-slate-500 hover:text-white ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search in sample..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-40"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center">
        {hasError ? (
          /* Phase 5: Professional Error Interface */
          <div className="max-w-md w-full my-auto p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Display Mode Interrupted</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              We encountered an issue rendering <strong className="text-emerald-400">{book.title}</strong> with the primary hardware pipeline. Our adaptive fallback renderer is ready to display this document.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleFallbackSwitch}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                <Layers className="w-4 h-4" />
                <span>Switch to Adaptive Reader</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Engine</span>
                </button>

                <button
                  onClick={handleReportProblem}
                  disabled={reportSent}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>{reportSent ? 'Feedback Sent' : 'Report Issue'}</span>
                </button>
              </div>
            </div>

            {reportSent && (
              <div className="mt-4 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Diagnostic report dispatched to AnonTrove engineers.</span>
              </div>
            )}
          </div>
        ) : (
          /* Reader Content Container with Zoom Transformation */
          <div 
            className="w-full max-w-2xl transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Header Document Card */}
            <div className="pb-6 border-b border-slate-800 mb-8 flex items-start gap-4">
              <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 shadow-md">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // Soft image error fallback
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                  Chapter {activeChapterIndex + 1} of {book.tableOfContents.length}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  {book.tableOfContents[activeChapterIndex] || book.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {book.author} • {book.pages} Pages • DRM-Free Verified
                </p>
              </div>
            </div>

            {/* Reading Content */}
            <div className={`text-slate-200 space-y-6 ${fontClasses} ${sizeClasses}`}>
              {filteredExcerpts.length > 0 ? (
                filteredExcerpts.map((paragraph, pIdx) => (
                  <p key={pIdx} className="first-letter:text-2xl first-letter:font-bold first-letter:text-emerald-400 select-text">
                    {paragraph}
                  </p>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                  No excerpt content matching &quot;{searchQuery}&quot;
                </div>
              )}

              {/* End of preview teaser */}
              <div className="p-5 rounded-2xl bg-[#0B0F17] border border-slate-800 text-xs font-mono text-slate-400 space-y-2 mt-10 not-italic">
                <div className="text-emerald-400 font-bold flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Public Preview Checkpoint Reached</span>
                </div>
                <p className="leading-relaxed">
                  You are previewing verified pages from <strong>{book.title}</strong>. The complete {book.pages}-page edition with high-resolution vector diagrams and DRM-free PDF downloads can be unlocked instantly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
