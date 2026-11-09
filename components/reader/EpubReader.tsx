'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  AlertCircle,
  X,
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

const THEME_STYLES: Record<ThemeMode, { bg: string; text: string; headerBg: string; border: string; readerBg: string; readerText: string }> = {
  DARK: {
    bg: 'bg-[#0A0E17]',
    text: 'text-slate-200',
    headerBg: 'bg-[#0D121D]',
    border: 'border-slate-800',
    readerBg: '#0d1424',
    readerText: '#e2e8f0',
  },
  SEPIA: {
    bg: 'bg-[#FBF0D9]',
    text: 'text-[#433422]',
    headerBg: 'bg-[#F4E3C1]',
    border: 'border-[#E2CEAA]',
    readerBg: '#fdf8ed',
    readerText: '#433422',
  },
  LIGHT: {
    bg: 'bg-[#FAFAFA]',
    text: 'text-slate-800',
    headerBg: 'bg-white',
    border: 'border-slate-200',
    readerBg: '#ffffff',
    readerText: '#1e293b',
  },
};

export default function EpubReader({
  title,
  author,
  streamUrl,
  watermarkText = 'Licensed Personal Copy • AnonTrove',
  allowDownload = false,
  onClose,
  onProgressUpdate,
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  const [theme, setTheme] = useState<ThemeMode>('DARK');
  const [fontSize, setFontSize] = useState(16);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<any[]>([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [totalChapters, setTotalChapters] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTheme = THEME_STYLES[theme];

  // ── Anti-extraction guards ──────────────────────────────────────────────
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const blockKey = (e: KeyboardEvent) => {
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

  // ── Load epub.js ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewerRef.current) return;
    let cancelled = false;

    async function loadEpub() {
      try {
        setIsLoading(true);
        setError(null);

        const Epub = (await import('epubjs')).default;
        if (cancelled) return;

        const book = Epub(streamUrl);
        bookRef.current = book;

        const rendition = book.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          manager: 'default',
        } as any);
        renditionRef.current = rendition;

        // Apply protective theme
        applyThemeToRendition(rendition, theme, fontSize, watermarkText);

        await rendition.display();
        if (cancelled) return;

        // Load TOC
        const navigation = await book.loaded.navigation;
        if (!cancelled && navigation?.toc) {
          setToc(navigation.toc);
          setTotalChapters(navigation.toc.length || 1);
        }

        // Track location changes
        rendition.on('locationChanged', (loc: any) => {
          if (!cancelled) {
            const spine = (book as any).spine;
            if (spine && loc?.start) {
              const idx = spine.get(loc.start)?.index ?? 0;
              const c = idx + 1;
              setCurrentChapter(c);
              onProgressUpdate?.(c, totalChapters);
            }
          }
        });

        setIsLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[EpubReader] Load error:', err);
          setError('Could not render the EPUB. Please try downloading it instead.');
          setIsLoading(false);
        }
      }
    }

    loadEpub();

    return () => {
      cancelled = true;
      renditionRef.current?.destroy?.();
      bookRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // Apply theme updates after initial load
  useEffect(() => {
    if (renditionRef.current && !isLoading) {
      applyThemeToRendition(renditionRef.current, theme, fontSize, watermarkText);
    }
  }, [theme, fontSize, isLoading, watermarkText]);

  const goNext = useCallback(() => {
    renditionRef.current?.next?.();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev?.();
  }, []);

  const goToTocItem = useCallback((href: string) => {
    renditionRef.current?.display?.(href);
    setIsTocOpen(false);
  }, []);

  return (
    <div
      className={`flex flex-col h-screen ${activeTheme.bg} ${activeTheme.text} transition-colors duration-200 overflow-hidden`}
      style={{ userSelect: 'none' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className={`h-14 border-b ${activeTheme.border} ${activeTheme.headerBg} px-4 flex items-center justify-between shrink-0 shadow-sm z-20`}
      >
        <div className="flex items-center space-x-3 truncate mr-4">
          <BookOpen className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-bold truncate">{title}</h4>
            <p className="text-[10px] opacity-70 truncate">By {author} · EPUB Secure Reader</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* TOC */}
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="p-2 rounded-lg border border-current opacity-70 hover:opacity-100 transition-opacity"
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Font Size */}
          <div className="hidden sm:flex items-center border border-current rounded-lg p-0.5 opacity-80 text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              className="px-2 py-1 font-bold"
              title="Decrease Font"
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono min-w-[36px] text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              className="px-2 py-1 font-bold"
              title="Increase Font"
            >
              A+
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center border border-current rounded-lg p-0.5 opacity-80">
            <button
              onClick={() => setTheme('DARK')}
              className={`p-1.5 rounded ${theme === 'DARK' ? 'bg-emerald-500 text-slate-950' : ''}`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('SEPIA')}
              className={`p-1.5 rounded ${theme === 'SEPIA' ? 'bg-amber-600 text-white' : ''}`}
              title="Sepia Mode"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('LIGHT')}
              className={`p-1.5 rounded ${theme === 'LIGHT' ? 'bg-slate-200 text-slate-950' : ''}`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-current opacity-70 hover:opacity-100 transition-opacity"
              title="Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ── TOC Drawer ─────────────────────────────────────────────── */}
      {isTocOpen && (
        <div
          className={`absolute top-14 left-0 bottom-0 w-72 z-30 border-r ${activeTheme.border} ${activeTheme.headerBg} overflow-y-auto shadow-2xl`}
        >
          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">Contents</h3>
            {toc.length === 0 && (
              <p className="text-xs opacity-50">No chapters found</p>
            )}
            {toc.map((item, idx) => (
              <button
                key={idx}
                onClick={() => goToTocItem(item.href)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-black/10 transition-colors truncate"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Reader Area ─────────────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-slate-400 z-10">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
            <span className="text-sm">Rendering secure EPUB…</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-red-400 max-w-sm mx-auto text-center p-8 z-10">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm">{error}</p>
            {allowDownload && (
              <a
                href={streamUrl}
                download
                className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs hover:bg-emerald-500/30"
              >
                Download EPUB Instead
              </a>
            )}
          </div>
        )}

        {/* epub.js mounts here */}
        <div
          ref={viewerRef}
          className="w-full h-full"
          style={{ visibility: isLoading || error ? 'hidden' : 'visible' }}
        />
      </main>

      {/* ── Footer / Chapter Nav ─────────────────────────────────────── */}
      <footer
        className={`h-12 border-t ${activeTheme.border} ${activeTheme.headerBg} px-4 flex items-center justify-between shrink-0 text-xs z-20`}
      >
        <button
          onClick={goPrev}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-current opacity-80 hover:opacity-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-1.5 text-[11px] opacity-70">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-mono">Encrypted Stream</span>
          {totalChapters > 1 && (
            <span className="font-mono">· Ch {currentChapter}/{totalChapters}</span>
          )}
        </div>

        <button
          onClick={goNext}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-current opacity-80 hover:opacity-100 disabled:opacity-30"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyThemeToRendition(
  rendition: any,
  theme: ThemeMode,
  fontSize: number,
  watermarkText: string
) {
  const t = THEME_STYLES[theme];
  rendition.themes.default({
    body: {
      background: t.readerBg,
      color: t.readerText,
      'font-size': `${fontSize}px`,
      'line-height': '1.75',
      padding: '2em 2.5em',
      'font-family': 'Georgia, "Times New Roman", serif',
    },
    // Subtle repeating watermark via pseudo element is not injectable via CSS-in-JS
    // We inject a fixed overlay div after render
    'a': { color: 'inherit', 'text-decoration': 'underline' },
    'img, video': { 'max-width': '100%', 'pointer-events': 'none' },
  });

  // Inject protective overlay into iframe
  try {
    const iframe = rendition.manager?.container?.querySelector('iframe');
    if (iframe?.contentDocument?.body) {
      injectProtectionOverlay(iframe.contentDocument, watermarkText, t.readerText);
    }
    // Also hook future renders
    rendition.on('rendered', (section: any, view: any) => {
      const doc = view?.iframe?.contentDocument || view?.document;
      if (doc?.body) {
        injectProtectionOverlay(doc, watermarkText, t.readerText);
      }
    });
  } catch {
    // Cross-origin or not ready yet — OK to skip
  }
}

function injectProtectionOverlay(doc: Document, watermarkText: string, textColor: string) {
  if (doc.getElementById('__anontrove_wm')) return;

  const style = doc.createElement('style');
  style.id = '__anontrove_wm';
  style.textContent = `
    ::selection { background: transparent; }
    body { -webkit-user-select: none; user-select: none; }
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background-image: repeating-linear-gradient(
        -20deg,
        transparent 0px,
        transparent 60px,
        transparent 61px
      );
    }
  `;
  doc.head.appendChild(style);

  // Watermark canvas overlay
  const overlay = doc.createElement('div');
  overlay.id = '__anontrove_canvas_wm';
  overlay.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 9998;
    overflow: hidden; opacity: 0.06; display: flex; flex-direction: column;
    justify-content: space-around; align-items: center;
    transform: rotate(-18deg); padding: 40px; gap: 60px;
  `;
  for (let i = 0; i < 12; i++) {
    const span = doc.createElement('span');
    span.textContent = watermarkText;
    span.style.cssText = `
      font-family: monospace; font-size: 11px; font-weight: bold;
      color: ${textColor}; white-space: nowrap; letter-spacing: 2px;
    `;
    overlay.appendChild(span);
  }
  doc.body.appendChild(overlay);

  // Block right-click and print shortcuts in iframe
  doc.addEventListener('contextmenu', (e) => e.preventDefault());
  doc.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });
}
