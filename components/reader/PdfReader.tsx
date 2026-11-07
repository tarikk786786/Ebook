'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  Lock, 
  Download,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface PdfReaderProps {
  title: string;
  author: string;
  streamUrl: string;
  watermarkText?: string;
  allowDownload?: boolean;
  onClose?: () => void;
  onProgressUpdate?: (page: number, total: number) => void;
}

export default function PdfReader({
  title,
  author,
  streamUrl,
  watermarkText = 'Licensed Personal Copy',
  allowDownload = true,
  onClose,
  onProgressUpdate,
}: PdfReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(50, Math.min(200, prev + delta)));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => {
      const next = Math.min(totalPages, p + 1);
      onProgressUpdate?.(next, totalPages);
      return next;
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => {
      const prev = Math.max(1, p - 1);
      onProgressUpdate?.(prev, totalPages);
      return prev;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col h-screen bg-[#080B11] text-slate-100 select-none overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-[#0B0F17]/95 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 truncate mr-4">
          <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h4>
            <p className="text-[10px] text-slate-400 truncate">By {author} • Secure Reader</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => handleZoom(-10)}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Optional Download button */}
          {allowDownload && (
            <a
              href={streamUrl}
              download
              className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              title="Download DRM-Free File"
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Exit Reader
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas & Watermarked Viewer */}
      <div className="flex-1 relative overflow-auto flex items-center justify-center p-4 sm:p-6 bg-[#06080E]">
        {/* Dynamic Canvas / Embed Wrapper */}
        <div 
          className="relative max-w-4xl w-full aspect-[1/1.4] bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* Native PDF Object Embed via Stream URL */}
          <iframe
            src={`${streamUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={title}
          />

          {/* Dynamic Customer Watermark Overlay (Anti-leakage protection) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 opacity-25">
            <div className="text-[10px] font-mono text-slate-600 tracking-wider">
              {watermarkText}
            </div>
            <div className="text-center text-xs font-mono text-slate-600 rotate-[-30deg] tracking-widest font-semibold uppercase">
              {watermarkText} • Authorized Access Only
            </div>
            <div className="text-right text-[10px] font-mono text-slate-600">
              AnonTrove Secure Reader
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Paging Bar */}
      <footer className="h-12 border-t border-slate-800 bg-[#0B0F17]/95 px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] hidden sm:inline">Protected Stream • Server Authorized</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300 text-xs px-2">
            Page {currentPage} of {totalPages || '—'}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
          AES-256 Single-Use Stream Token
        </div>
      </footer>
    </div>
  );
}
