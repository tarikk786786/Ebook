'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BookOpen, Search, Zap, ShoppingBag, Bookmark, Wrench, Globe, Heart } from 'lucide-react';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currency?: 'INR' | 'USD';
  onToggleCurrency?: () => void;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  currency = 'INR',
  onToggleCurrency,
}: NavbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { itemCount, openCart } = useCart();

  // Keyboard shortcut '/' to focus search
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0B0F17]/95 backdrop-blur-md">
      {/* Top Editorial Value Banner */}
      <div className="bg-[#090D14] border-b border-slate-800/80 text-slate-400 px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2">
        <span className="text-slate-200 font-medium">Knowledge Access Mission:</span>
        <span className="text-slate-400">12,000+ Curated Digital Titles Starting at ₹29 • Transparent Upkeep & Open Curation</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 shrink-0 group">
          <div className="h-9 w-9 rounded-md bg-[#111622] border border-slate-800 flex items-center justify-center text-slate-200">
            <BookOpen className="h-4.5 w-4.5 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-slate-200 transition-colors">
                TBBooks
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded">
                Vault
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">Digital Literature Vault</p>
          </div>
        </Link>

        {/* Global Search Bar with Keyboard Shortcut */}
        {onSearchChange && (
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search 12,000+ titles by name, author, topic (e.g. Linux, Trading, Python)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#0F141C] border border-slate-800 focus:border-slate-600 rounded-md pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono pointer-events-none hidden lg:inline-block">
                /
              </kbd>
            </div>
          </div>
        )}

        {/* Action Controls & Value Badges */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Mission Link */}
          <Link
            href="/mission"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#111622] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Our Mission & Transparent Purpose"
          >
            <Heart className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Our Mission</span>
          </Link>

          {/* 1,000 Curated Discovery Catalog Link */}
          <Link
            href="/books"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#111622] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="1,000 Global Startup & Business Books Discovery"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Catalog</span>
          </Link>

          {/* Ebook Tools Directory Link */}
          <Link
            href="/tools"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#111622] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Ebook Tools & Download Center"
          >
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Tools</span>
          </Link>

          {/* Customer Library Link */}
          <Link
            href="/library"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#111622] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="My Reading Library"
          >
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          {/* Cart Trigger Button */}
          <button
            onClick={openCart}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold transition-colors shadow-sm"
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-900" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </button>

          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="px-2 py-1.5 rounded-md bg-[#111622] border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors hidden sm:block"
              title="Toggle estimated display currency"
            >
              {currency === 'INR' ? '₹ INR' : '$ USD'}
            </button>
          )}

          {/* FamPay UPI Direct badge */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-[#111622] border border-slate-800 text-xs text-slate-400">
            <Zap className="h-3 w-3 text-slate-400" />
            <span className="font-mono text-[11px]">FamPay UPI Direct</span>
          </div>
        </div>
      </div>
    </header>
  );
}
