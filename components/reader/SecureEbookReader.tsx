'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  Download,
  Sun,
  Moon,
  Coffee
} from 'lucide-react';

interface SecureEbookReaderProps {
  token: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory: string;
  format: string;
  orderId: string;
  expiresAt: number;
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
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 minutes
  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer for active reading session
  useEffect(() => {
    const calcTimeLeft = () => {
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
    };

    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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

  const streamUrl = `/api/reader/${token}`;
  const downloadUrl = `/api/download/${token}`;

  // Watermark pattern string
  const watermarkText = `AnonTrove Verified • Order ${orderId.slice(0, 12)} • Authorized Reader`;

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen flex flex-col ${
        theme === 'dark' 
          ? 'bg-[#0B0F17] text-slate-100' 
          : theme === 'sepia' 
          ? 'bg-[#FBF0D9] text-[#433422]' 
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Top Reading Navigation Bar */}
      <header className={`px-4 py-3 border-b flex items-center justify-between z-30 select-none ${
        theme === 'dark' 
          ? 'bg-[#121826]/90 border-slate-800 backdrop-blur' 
          : theme === 'sepia' 
          ? 'bg-[#F4E4C1]/90 border-[#E2CE9F] text-[#433422]' 
          : 'bg-white/90 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Return to Storefront"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </Link>

          <div className="h-4 w-px bg-slate-700/40" />

          <div className="max-w-[200px] sm:max-w-md truncate">
            <h1 className="text-sm font-bold truncate leading-tight">{bookTitle}</h1>
            <p className="text-[11px] opacity-70 truncate">{bookAuthor} • {bookCategory}</p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Active Session Badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Session: {formatTime(timeLeft)}</span>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-slate-700/30">
            <button
              onClick={() => setTheme('dark')}
              className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-700 text-white' : 'opacity-60 hover:opacity-100'}`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1 rounded ${theme === 'sepia' ? 'bg-[#E2CE9F] text-amber-950' : 'opacity-60 hover:opacity-100'}`}
              title="Sepia Mode"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-1 rounded ${theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'opacity-60 hover:opacity-100'}`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center space-x-1 bg-black/20 rounded-lg p-0.5 border border-slate-700/30">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 15))}
              className="p-1 rounded hover:bg-slate-700/50"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 min-w-[32px] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 15))}
              className="p-1 rounded hover:bg-slate-700/50"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Direct Fallback Button */}
          <a
            href={downloadUrl}
            download
            className="p-1.5 rounded-lg hover:bg-slate-800/40 text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Download Offline Copy"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Reading Viewport with Dynamic Protection Watermark */}
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
        {/* Dynamic Watermark Layer (Deters mass screengrab & automated scraping) */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 flex flex-wrap items-center justify-around gap-16 p-8 overflow-hidden select-none opacity-[0.07] rotate-[-22deg]"
          aria-hidden="true"
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="text-xs font-mono font-bold tracking-widest whitespace-nowrap">
              {watermarkText}
            </div>
          ))}
        </div>

        {/* Embedded Sandboxed Document Viewer */}
        <div 
          className="w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-2xl border transition-all flex flex-col bg-slate-900/60"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            borderColor: theme === 'dark' ? '#1e293b' : theme === 'sepia' ? '#E2CE9F' : '#e2e8f0'
          }}
        >
          <iframe
            src={`${streamUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            title={`Protected Reading View - ${bookTitle}`}
            className="w-full flex-1 h-[calc(100vh-80px)] border-0 rounded-xl"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </main>

      {/* Reader Footer with Security Status */}
      <footer className="py-2 px-4 text-center border-t border-slate-800/40 text-[11px] opacity-60 flex items-center justify-between select-none font-mono">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Trace Dynamic Stream • AES-256-GCM Session</span>
        </div>
        <div>
          <span>Order: {orderId.slice(0, 10)}...</span>
        </div>
      </footer>
    </div>
  );
}
