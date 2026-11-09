'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, X, BookOpen, ArrowRight, Zap, Tag } from 'lucide-react';
import { Book } from '@/lib/catalog';

interface CommandKModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBook: (book: Book) => void;
  onPreviewBook: (book: Book) => void;
}

export default function CommandKModal({
  isOpen,
  onClose,
  books,
  onSelectBook,
  onPreviewBook,
}: CommandKModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Fast client-side matching
  const filtered = query.trim()
    ? books.filter(b => {
        const q = query.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : books.slice(0, 6);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectBook(filtered[selectedIndex]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#262626]">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search 18,529 eBooks by title, author, category, or ISBN..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <div className="flex items-center space-x-1.5 ml-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 border border-neutral-700 rounded">
              ESC
            </kbd>
            <button 
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-neutral-800/50">
          {filtered.length > 0 ? (
            filtered.map((book, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={book.id}
                  onClick={() => {
                    onSelectBook(book);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-950/40 border border-emerald-500/30' : 'hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-10 h-14 bg-neutral-800 rounded shrink-0 overflow-hidden relative border border-neutral-700/60">
                      <img
                        src={book.coverImage || '/covers/default.jpg'}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div className="truncate">
                      <h4 className="text-sm font-medium text-neutral-100 truncate">
                        {book.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        {book.author} • <span className="text-emerald-400 font-medium">₹{book.priceInInr}</span>
                      </p>
                      <span className="inline-block text-[10px] px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded mt-0.5 border border-neutral-700">
                        {book.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewBook(book);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 transition-colors"
                    >
                      Preview
                    </button>
                    <span className="text-xs font-semibold text-emerald-400">
                      Buy ₹{book.priceInInr}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-neutral-500">
              No matching books found for "{query}". Try another title, author, or keyword.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-neutral-900/60 border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1 py-0.5 bg-neutral-800 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-neutral-800 rounded">↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-neutral-800 rounded">↵</kbd> Select</span>
          </div>
          <span className="text-neutral-400">18,529 Verified eBooks Indexed</span>
        </div>
      </div>
    </div>
  );
}
