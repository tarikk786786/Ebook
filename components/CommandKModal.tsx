'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div 
        className="w-full max-w-2xl bg-white border border-[#E8E4DC] rounded-2xl shadow-2xl overflow-hidden text-[#24231F]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#E8E4DC]">
          <Search className="w-5 h-5 text-[#81796D] mr-3 shrink-0" />
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
            className="w-full bg-transparent text-sm text-[#24231F] placeholder-[#81796D] focus:outline-none"
          />
          <div className="flex items-center space-x-1.5 ml-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#81796D] bg-[#FAF8F5] border border-[#E8E4DC] rounded">
              ESC
            </kbd>
            <button 
              onClick={onClose}
              className="p-1 text-[#81796D] hover:text-[#24231F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#E8E4DC]/40">
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
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FAF6F1] border border-[#F2E8DC]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-10 h-14 bg-[#FAF8F5] rounded-md shrink-0 overflow-hidden relative border border-[#E8E4DC]">
                      <img
                        src={book.coverImage || `/api/covers/${book.slug}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div className="truncate">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#24231F] truncate font-serif">
                        {book.title}
                      </h4>
                      <p className="text-xs text-[#81796D] truncate font-sans">
                        {book.author} • <span className="text-[#9A704B] font-bold">₹{book.priceInInr}</span>
                      </p>
                      <span className="inline-block text-[9px] px-1.5 py-0.2 bg-[#FAF8F5] text-[#81796D] rounded mt-0.5 border border-[#E8E4DC] uppercase font-mono">
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
                      className="px-2.5 py-1 text-xs font-medium text-[#6E685F] hover:text-[#24231F] bg-white hover:bg-[#FAF8F5] rounded-lg border border-[#E8E4DC] transition-colors"
                    >
                      Preview
                    </button>
                    <span className="text-xs font-bold text-[#24231F] bg-[#FAF6F1] border border-[#F2E8DC] px-2 py-0.5 rounded-md font-mono">
                      ₹{book.priceInInr}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-[#81796D]">
              No matching books found for "{query}". Try another title, author, or keyword.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#FAF8F5] border-t border-[#E8E4DC] flex items-center justify-between text-[11px] text-[#81796D]">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1 py-0.5 bg-white border border-[#E8E4DC] rounded text-[#24231F]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-[#E8E4DC] rounded text-[#24231F]">↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-white border border-[#E8E4DC] rounded text-[#24231F]">↵</kbd> Select</span>
          </div>
          <span className="text-[#9A704B] font-medium font-mono">18,529 Verified eBooks Indexed</span>
        </div>
      </div>
    </div>
  );
}
