'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BookOpen, Search, Zap, Lock, Sparkles, Tag, ShoppingBag, Bookmark } from 'lucide-react';

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
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 text-slate-950 px-4 py-1 text-center text-[11px] font-bold tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
        <span>PREMIUM DIGITAL COMMERCE: 1,668+ Verified Digital Titles Starting at ₹29 • Instant Multi-Item Checkout</span>
        <Tag className="w-3 h-3 text-slate-900" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 shrink-0 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="h-full w-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Anon<span className="text-emerald-400">Trove</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-full font-bold">
                Store
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Independent Ebook Commerce</p>
          </div>
        </Link>

        {/* Global Search Bar with Keyboard Shortcut */}
        {onSearchChange && (
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search 1,668+ titles by name, author, topic (e.g. Linux, Trading, Python, Notes)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono pointer-events-none hidden lg:inline-block">
                /
              </kbd>
            </div>
          </div>
        )}

        {/* Action Controls & Value Badges */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Customer Library Link */}
          <Link
            href="/library"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            title="My Reading Library"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">My Library</span>
          </Link>

          {/* Cart Trigger Button */}
          <button
            onClick={openCart}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-mono text-[10px] font-black">
                {itemCount}
              </span>
            )}
          </button>

          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-sm hidden sm:block"
              title="Toggle estimated display currency"
            >
              {currency === 'INR' ? '₹ INR' : '$ USD'}
            </button>
          )}

          {/* UPI Direct badge */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span className="font-semibold text-[11px]">Razorpay + UPI</span>
          </div>
        </div>
      </div>
    </header>
  );
}
