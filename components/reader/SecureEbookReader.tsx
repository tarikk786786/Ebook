'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Coffee,
  Maximize,
  Minimize,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// Lazy-load heavy reader components to reduce initial bundle
const PdfReader = dynamic(() => import('./PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#06080E]">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
    </div>
  ),
});

const EpubReader = dynamic(() => import('./EpubReader'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#06080E]">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
    </div>
  ),
});

interface SecureEbookReaderProps {
  token: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory: string;
  format: string;
  orderId: string;
  expiresAt: number; // Unix ms timestamp
}

type Theme = 'dark' | 'sepia' | 'light';

const THEME_CLASSES: Record<Theme, string> = {
  dark: 'bg-[#0B0F17] text-slate-100',
  sepia: 'bg-[#FBF0D9] text-[#433422]',
  light: 'bg-[#F8FAFC] text-slate-900',
};

const HEADER_CLASSES: Record<Theme, string> = {
  dark: 'bg-[#121826]/90 border-slate-800 text-slate-100 backdrop-blur',
  sepia: 'bg-[#F4E4C1]/90 border-[#E2CE9F] text-[#433422]',
  light: 'bg-white/90 border-slate-200 text-slate-800',
};

/** Determine reader format from file name or explicit format field */
function detectFormat(format: string): 'pdf' | 'epub' | 'other' {
  const f = format?.toLowerCase();
  if (f?.includes('pdf')) return 'pdf';
  if (f?.includes('epub')) return 'epub';
  return 'other';
}

export default function SecureEbookReader({
  token,
  bookTitle,
  bookAuthor,
  bookCategory,
  format,
  orderId,
  expiresAt,
}: SecureEbookReaderProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const streamUrl = `/api/reader/${token}`;
  const downloadUrl = `/api/download/${token}`;
  const readerFormat = detectFormat(format);
  const watermarkText = `AnonTrove Verified • Order ${orderId.slice(0, 10)} • Personal License`;

  // ── Session countdown & auto-redirect on expiry ──────────────────────
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setIsExpired(true);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Auto-redirect 5 seconds after expiry
  useEffect(() => {
    if (!isExpired) return;
    const t = setTimeout(() => {
      window.location.href = '/';
    }, 5000);
    return () => clearTimeout(t);
  }, [isExpired]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Session Expired Screen ───────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reading Session Expired</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your 24-hour reading session has ended. Returning to the storefront shortly…
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 py-3 px-6 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Shared top navigation bar (shown above the reader for all formats) ─
  const TopBar = () => (
    <header
      className={`px-4 py-3 border-b flex items-center justify-between z-30 select-none shrink-0 ${HEADER_CLASSES[theme]}`}
    >
      {/* Left: Back + Book Info */}
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors flex items-center space-x-1 text-xs font-medium"
          title="Return to Storefront"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Store</span>
        </Link>

        <div className="h-4 w-px bg-current opacity-20" />

        <div className="max-w-[180px] sm:max-w-xs truncate">
          <h1 className="text-sm font-bold truncate leading-tight">{bookTitle}</h1>
          <p className="text-[11px] opacity-60 truncate">
            {bookAuthor} · {bookCategory}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Session Timer */}
        <div
          className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono ${
            timeLeft < 300
              ? 'bg-red-950/60 border border-red-800/60 text-red-400'
              : 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Session: {formatTime(timeLeft)}</span>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center bg-black/10 rounded-lg p-0.5 border border-current/20">
          <button
            onClick={() => setTheme('dark')}
            className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-700 text-white' : 'opacity-50 hover:opacity-100'}`}
            title="Dark"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('sepia')}
            className={`p-1 rounded ${theme === 'sepia' ? 'bg-[#E2CE9F] text-amber-950' : 'opacity-50 hover:opacity-100'}`}
            title="Sepia"
          >
            <Coffee className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`p-1 rounded ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            title="Light"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );

  // ── Render: PDF ──────────────────────────────────────────────────────
  if (readerFormat === 'pdf') {
    return (
      <div
        ref={containerRef}
        className={`min-h-screen flex flex-col ${THEME_CLASSES[theme]}`}
      >
        <TopBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PdfReader
            title={bookTitle}
            author={bookAuthor}
            streamUrl={streamUrl}
            watermarkText={watermarkText}
            allowDownload={false}
          />
        </div>
        <ReaderFooter orderId={orderId} />
      </div>
    );
  }

  // ── Render: EPUB ─────────────────────────────────────────────────────
  if (readerFormat === 'epub') {
    return (
      <div
        ref={containerRef}
        className={`min-h-screen flex flex-col ${THEME_CLASSES[theme]}`}
      >
        <TopBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EpubReader
            title={bookTitle}
            author={bookAuthor}
            streamUrl={streamUrl}
            watermarkText={watermarkText}
            allowDownload={false}
          />
        </div>
        <ReaderFooter orderId={orderId} />
      </div>
    );
  }

  // ── Render: Unsupported / fallback iframe ────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col ${THEME_CLASSES[theme]}`}
    >
      <TopBar />
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
        {/* Watermark overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 flex flex-wrap items-center justify-around gap-16 p-8 overflow-hidden select-none opacity-[0.06] rotate-[-22deg]"
          aria-hidden="true"
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="text-xs font-mono font-bold tracking-widest whitespace-nowrap">
              {watermarkText}
            </div>
          ))}
        </div>

        <div className="w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col bg-slate-900/60">
          <iframe
            src={`${streamUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            title={`Protected Reading View - ${bookTitle}`}
            className="w-full flex-1 h-[calc(100vh-140px)] border-0 rounded-xl"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </main>
      <ReaderFooter orderId={orderId} />
    </div>
  );
}

function ReaderFooter({ orderId }: { orderId: string }) {
  return (
    <footer className="py-2 px-4 border-t border-slate-800/40 text-[11px] opacity-60 flex items-center justify-between select-none font-mono shrink-0">
      <div className="flex items-center space-x-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Zero-Trace Stream · AES-256-GCM</span>
      </div>
      <div>Order: {orderId.slice(0, 10)}…</div>
    </footer>
  );
}
