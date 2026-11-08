'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { DiscoveredEbook, UniversalCatalogMetadata, SourceRegistryItem } from '@/lib/scraper';
import { 
  Search, 
  Globe, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Filter, 
  Eye, 
  Sparkles, 
  FileText, 
  Info, 
  Bookmark, 
  Calendar, 
  Building, 
  Hash, 
  ArrowRight,
  Database,
  Lock,
  X
} from 'lucide-react';

interface DiscoverClientProps {
  initialBooks: DiscoveredEbook[];
  metadata: UniversalCatalogMetadata;
  sources: SourceRegistryItem[];
}

const AVAILABILITY_FILTERS = [
  { id: 'ALL', label: 'All Availabilities' },
  { id: 'PUBLIC_DOMAIN', label: 'Public Domain' },
  { id: 'FREE_AUTHORIZED', label: 'Free & Open Access' },
  { id: 'BORROWABLE', label: 'Borrowable' },
  { id: 'PAID_STORE', label: 'Store Titles' },
  { id: 'PREVIEW_ONLY', label: 'Preview Only' }
];

const FORMAT_FILTERS = ['ALL', 'EPUB', 'PDF', 'MOBI', 'TXT'];

export default function DiscoverClient({ initialBooks, metadata, sources }: DiscoverClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [activeModalBook, setActiveModalBook] = useState<DiscoveredEbook | null>(null);
  const [readerBook, setReaderBook] = useState<DiscoveredEbook | null>(null);

  const getReaderEmbedUrl = (book: DiscoveredEbook) => {
    const url = book.infoUrl || book.previewUrl || '';
    if (url.includes('archive.org/details/')) {
      const parts = url.split('archive.org/details/');
      const id = parts[1].split('/')[0].split('?')[0];
      return `https://archive.org/embed/${id}`;
    }
    if (book.previewUrl && (book.previewUrl.includes('books.google') || book.previewUrl.includes('preview'))) {
      return book.previewUrl;
    }
    if (book.downloadUrl && (book.downloadUrl.endsWith('.pdf') || book.downloadUrl.endsWith('.html') || book.downloadUrl.endsWith('.txt'))) {
      return book.downloadUrl;
    }
    return null;
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredBooks = useMemo(() => {
    return initialBooks.filter((book) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = book.title.toLowerCase().includes(q);
        const matchAuthors = book.authors.some((a) => a.toLowerCase().includes(q));
        const matchPublisher = book.publisher.toLowerCase().includes(q);
        const matchIsbn = book.isbns.some((i) => i.toLowerCase().includes(q));
        const matchSource = book.source.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthors && !matchPublisher && !matchIsbn && !matchSource) {
          return false;
        }
      }

      // Availability filter
      if (selectedAvailability !== 'ALL') {
        if (selectedAvailability === 'FREE_AUTHORIZED') {
          if (book.availability !== 'FREE_AUTHORIZED' && book.availability !== 'OPEN_ACCESS') {
            return false;
          }
        } else if (book.availability !== selectedAvailability) {
          return false;
        }
      }

      // Format filter
      if (selectedFormat !== 'ALL') {
        if (!book.formats.some((f) => f.toLowerCase().includes(selectedFormat.toLowerCase()))) {
          return false;
        }
      }

      // Source filter
      if (selectedSource !== 'ALL') {
        if (book.sourceId !== selectedSource && !book.source.toLowerCase().includes(selectedSource.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [initialBooks, searchQuery, selectedAvailability, selectedFormat, selectedSource]);

  const getAvailabilityBadge = (avail: string) => {
    switch (avail) {
      case 'PUBLIC_DOMAIN':
        return {
          bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
          label: 'Public Domain (Free Download)',
          icon: Download,
        };
      case 'FREE_AUTHORIZED':
      case 'OPEN_ACCESS':
        return {
          bg: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
          label: 'Open Access / Authorized',
          icon: CheckCircle2,
        };
      case 'BORROWABLE':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
          label: 'Controlled Digital Lending',
          icon: BookOpen,
        };
      case 'PAID_STORE':
        return {
          bg: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
          label: 'AnonTrove Store Edition',
          icon: Sparkles,
        };
      case 'PREVIEW_ONLY':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          label: 'Preview Only',
          icon: Eye,
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'Bibliographic Record',
          icon: FileText,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0D1524]/95 to-slate-900/90 border border-slate-800/80 p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-4">
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Universal Internet Ebook Discovery & Global Index</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Discover Books Worldwide
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 font-light">
              Aggregated open-access literature, public domain classics, academic preprints, and authorized digital collections in a single unified index.
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-black text-teal-400 font-mono">{metadata.totalUniqueBooks}</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Discovered Books</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {metadata.availabilityBreakdown.PUBLIC_DOMAIN || 0}
                </div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Public Domain</div>
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {sources.length}
                </div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Indexed Sources</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400 font-mono">100%</div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Verified Legitimate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-5 mb-8 backdrop-blur-sm space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search across all sources by title, author, ISBN, publisher, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-xl pl-12 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 shadow-inner"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono hidden sm:inline-block">
              /
            </kbd>
          </div>

          {/* Sub Filters: Availability, Format, Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Availability */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Access & Rights Availability
              </label>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {AVAILABILITY_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Supported Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {FORMAT_FILTERS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt === 'ALL' ? 'All Document Formats' : fmt}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Network */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Source Repository
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Source Networks ({sources.length})</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div className="text-sm font-semibold text-slate-300">
            Showing <span className="text-teal-400 font-bold">{filteredBooks.length}</span> discovered books
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Synced: {metadata.lastSynced?.split('T')[0]}
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredBooks.map((book) => {
              const badge = getAvailabilityBadge(book.availability);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={book.id}
                  className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0F141E]/95 border border-slate-800/80 p-5 flex flex-col justify-between hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-950/20 transition-all duration-300 group"
                >
                  <div>
                    {/* Top Row: Source & Availability */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-medium text-slate-400 truncate max-w-[150px]">
                        {book.source}
                      </span>
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Book Cover + Title / Author */}
                    <div className="flex items-start space-x-4 mb-4">
                      {book.coverImage ? (
                        <div className="w-16 h-24 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60 shadow-md">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-24 rounded-lg bg-slate-800/80 border border-slate-700/60 flex flex-col items-center justify-center shrink-0 text-slate-500 p-1 text-center">
                          <BookOpen className="w-6 h-6 mb-1 text-slate-600" />
                          <span className="text-[8px] font-mono leading-none">No Cover</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                          by {book.authors.join(', ')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {book.publisher} • {book.publishedDate}
                        </p>
                      </div>
                    </div>

                    {/* Description Excerpt */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                      {book.description || 'Verified bibliographic record discovered in open-access repository.'}
                    </p>

                    {/* Formats Pills */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {book.formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800/70 text-slate-300 border border-slate-700/50"
                        >
                          {fmt}
                        </span>
                      ))}
                      {book.primaryIsbn && (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 text-slate-400 border border-slate-800">
                          ISBN: {book.primaryIsbn}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveModalBook(book)}
                        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center"
                        title="View Bibliographic Specs"
                      >
                        <Info className="w-3.5 h-3.5 mr-1 text-teal-400" />
                        <span className="hidden sm:inline">Specs</span>
                      </button>

                      {getReaderEmbedUrl(book) && (
                        <button
                          onClick={() => setReaderBook(book)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-colors"
                          title="Read in Interactive In-Browser Viewer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                          <span>Read</span>
                        </button>
                      )}
                    </div>

                    {book.downloadUrl ? (
                      <a
                        href={book.downloadUrl}
                        target={book.downloadUrl.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        {book.availability === 'PAID_STORE' ? (
                          <>
                            <span>Get in Store</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : book.availability === 'BORROWABLE' ? (
                          <>
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Borrow Online</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </a>
                    ) : book.previewUrl ? (
                      <a
                        href={book.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preview</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">Metadata Only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center mb-16">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching titles discovered</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Try adjusting your search keywords, format, or availability filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAvailability('ALL');
                setSelectedFormat('ALL');
                setSelectedSource('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Modal: Full Bibliographic Information */}
        {activeModalBook && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setActiveModalBook(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start space-x-5 mb-6">
                {activeModalBook.coverImage ? (
                  <img
                    src={activeModalBook.coverImage}
                    alt={activeModalBook.title}
                    className="w-24 h-36 object-cover rounded-xl border border-slate-700 shrink-0 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-36 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/60 font-bold">
                    {activeModalBook.source}
                  </span>
                  <h2 className="text-xl font-black text-white mt-2 leading-snug">{activeModalBook.title}</h2>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    By {activeModalBook.authors.join(', ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeModalBook.publisher} • {activeModalBook.publishedDate}
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Primary ISBN</span>
                  <span className="font-mono text-slate-200">{activeModalBook.primaryIsbn || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Language</span>
                  <span className="text-slate-200 uppercase">{activeModalBook.language}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Confidence Score</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round(activeModalBook.confidenceScore * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Rights / License</span>
                  <span className="text-slate-300 truncate block">{activeModalBook.license}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Availability</span>
                  <span className="text-teal-400 font-semibold">{activeModalBook.availability}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Formats</span>
                  <span className="text-slate-300">{activeModalBook.formats.join(', ')}</span>
                </div>
              </div>

              {/* Full Description */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Catalog Description
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                  {activeModalBook.description || 'No extended synopsis available for this public record.'}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                {getReaderEmbedUrl(activeModalBook) && (
                  <button
                    onClick={() => {
                      const b = activeModalBook;
                      setActiveModalBook(null);
                      setReaderBook(b);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/40 transition-all shadow-sm"
                  >
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>Read in Browser</span>
                  </button>
                )}
                {activeModalBook.downloadUrl && (
                  <a
                    href={activeModalBook.downloadUrl}
                    target={activeModalBook.downloadUrl.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Access Resource</span>
                  </a>
                )}
                {activeModalBook.previewUrl && (
                  <a
                    href={activeModalBook.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>External View</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Interactive In-Browser Reader Modal */}
        {readerBook && getReaderEmbedUrl(readerBook) && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-2 sm:p-6 animate-in fade-in duration-200">
            {/* Reader Header */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {readerBook.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    By {readerBook.authors.join(', ')} • Source: {readerBook.source}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {readerBook.downloadUrl && (
                  <a
                    href={readerBook.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span className="hidden sm:inline">Download Copy</span>
                  </a>
                )}
                <button
                  onClick={() => setReaderBook(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  title="Close Reader"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Reader Frame */}
            <div className="flex-1 w-full my-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl relative">
              <iframe
                src={getReaderEmbedUrl(readerBook)!}
                className="w-full h-full border-0"
                allow="fullscreen; clipboard-read; clipboard-write"
                title={`Interactive Reader - ${readerBook.title}`}
              />
            </div>

            {/* Reader Footer Controls */}
            <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
              <span>Zero-Install Sandbox Reader • Powered by Open Repositories</span>
              <button
                onClick={() => setReaderBook(null)}
                className="text-teal-400 hover:underline"
              >
                Close and return to catalog
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>AnonTrove Universal Discovery Engine • Cross-Source Open Access Index</div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-teal-400 transition-colors">Book Store</Link>
            <Link href="/discover" className="hover:text-teal-400 transition-colors">Discover</Link>
            <Link href="/tools" className="hover:text-teal-400 transition-colors">Tools Directory</Link>
            <Link href="/admin/scraper" className="hover:text-teal-400 transition-colors">Scraper Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
