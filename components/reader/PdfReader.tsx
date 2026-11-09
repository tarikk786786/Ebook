'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Download,
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
  allowDownload = false,
  onClose,
  onProgressUpdate,
}: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // ── Anti-extraction guards ──────────────────────────────────────────────
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const blockKey = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+C, PrtSc
      if (
        (e.ctrlKey && ['s', 'p', 'c', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('keydown', blockKey);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('keydown', blockKey);
    };
  }, []);

  // ── PDF.js dynamic import (avoids SSR issues) ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);

        const pdfjsLib = await import('pdfjs-dist');
        // Use the bundled worker — no CDN, no unsafe-eval required
        // @ts-expect-error pdfjs worker lacks type declaration in some versions
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default || '';

        const loadingTask = pdfjsLib.getDocument({
          url: streamUrl,
          withCredentials: true,
          disableAutoFetch: true,
          disableStream: false,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setIsLoading(false);
        renderPage(pdf, 1, zoomLevel);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[PdfReader] Load error:', err);
          setError('Could not load the document. Please try again.');
          setIsLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  const renderPage = useCallback(
    async (pdf: any, pageNum: number, zoom: number) => {
      if (!canvasRef.current || !pdf) return;

      // Cancel any in-flight render
      renderTaskRef.current?.cancel?.();
      setIsRendering(true);

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom / 100 });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // ── Canvas watermark overlay ──────────────────────────────────
        context.save();
        context.globalAlpha = 0.07;
        context.fillStyle = '#1e293b';
        context.font = `bold ${Math.max(12, viewport.width / 50)}px monospace`;
        context.translate(viewport.width / 2, viewport.height / 2);
        context.rotate(-Math.PI / 6);
        for (let y = -viewport.height; y < viewport.height; y += 80) {
          for (let x = -viewport.width; x < viewport.width; x += 400) {
            context.fillText(watermarkText, x, y);
          }
        }
        context.restore();

        setIsRendering(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[PdfReader] Render error:', err);
          setIsRendering(false);
        }
      }
    },
    [watermarkText]
  );

  // Re-render when page or zoom changes
  useEffect(() => {
    if (pdfDocRef.current && !isLoading) {
      renderPage(pdfDocRef.current, currentPage, zoomLevel);
    }
  }, [currentPage, zoomLevel, isLoading, renderPage]);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(p);
    onProgressUpdate?.(p, totalPages);
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
      className="flex flex-col h-screen bg-[#080B11] text-slate-100 overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800 bg-[#0B0F17]/95 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3 truncate mr-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h4>
            <p className="text-[10px] text-slate-400 truncate">By {author} · Secure PDF Reader</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Zoom */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

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
              Exit
            </button>
          )}
        </div>
      </header>

      {/* ── Main Canvas Viewport ────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex items-start justify-center p-4 sm:p-6 bg-[#06080E]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
            <span className="text-sm">Loading secure document…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-red-400 max-w-sm text-center">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="relative">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 rounded">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="shadow-2xl rounded max-w-full"
              style={{ display: 'block' }}
            />
          </div>
        )}
      </main>

      {/* ── Footer / Page Nav ───────────────────────────────────────── */}
      <footer className="h-12 border-t border-slate-800 bg-[#0B0F17]/95 px-4 flex items-center justify-between shrink-0 text-xs z-20">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-[11px]">AES-256 Protected Stream</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300 text-xs px-2 min-w-[80px] text-center">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : '— / —'}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
          Canvas Render · Server Auth
        </div>
      </footer>
    </div>
  );
}
