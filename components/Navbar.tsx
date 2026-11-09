'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { BookOpen, Search, ShoppingBag, Heart, Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currency?: 'INR' | 'USD';
  onToggleCurrency?: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onOpenCommandK?: () => void;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  currency = 'INR',
  onToggleCurrency,
  wishlistCount = 0,
  onOpenWishlist,
  onOpenCommandK,
}: NavbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E4DC] text-[#24231F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center space-x-3 shrink-0 group">
          <div className="h-9 w-9 rounded border border-[#E8E4DC] bg-[#FAF8F5] flex items-center justify-center text-[#9A704B]">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[#24231F] group-hover:text-[#9A704B] transition-colors">
                AnonTrove
              </span>
              <span className="text-[10px] uppercase font-sans font-medium px-1.5 py-0.5 bg-[#FAF8F5] text-[#81796D] border border-[#E8E4DC] rounded hidden xs:inline-block">
                Est. 2024
              </span>
            </div>
            <p className="text-[10px] text-[#81796D] font-sans tracking-wide hidden sm:block">Independent Digital Bookstore</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium tracking-wide text-[#6E685F]">
          <Link href="/#catalog" className="hover:text-[#24231F] transition-colors">
            Catalog
          </Link>
          <Link href="/category/programming" className="hover:text-[#24231F] transition-colors">
            Categories
          </Link>
          <Link href="/#bestsellers" className="hover:text-[#24231F] transition-colors">
            Bestsellers
          </Link>
          <Link href="/#bundles" className="hover:text-[#24231F] transition-colors">
            Curated Bundles
          </Link>
          <Link href="/mission" className="hover:text-[#24231F] transition-colors">
            Mission
          </Link>
          <Link href="/about" className="hover:text-[#24231F] transition-colors">
            About & Support
          </Link>
        </nav>

        {/* Global Search Bar */}
        {onSearchChange && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#81796D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, author, or topic..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E8E4DC] focus:border-[#9A704B] rounded-md pl-9 pr-10 py-1.5 text-xs text-[#24231F] placeholder-[#81796D] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={onOpenCommandK || (() => searchInputRef.current?.focus())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white hover:bg-neutral-100 border border-[#E8E4DC] text-[10px] text-[#81796D] font-mono transition-colors flex items-center gap-0.5"
                title="Quick Search (Ctrl+K or /)"
              >
                <span>⌘K</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              onClick={onToggleCurrency}
              className="px-2.5 py-1 text-xs font-sans font-medium rounded border border-[#E8E4DC] bg-white text-[#6E685F] hover:text-[#24231F] hover:border-[#81796D] transition-colors hidden sm:inline-flex items-center gap-1"
              title="Toggle Currency"
            >
              <span>{currency}</span>
            </button>
          )}

          {/* Wishlist Button */}
          {onOpenWishlist && (
            <button
              onClick={onOpenWishlist}
              className="relative p-2 rounded-md border border-[#E8E4DC] bg-white text-[#6E685F] hover:text-[#24231F] hover:border-[#81796D] transition-colors"
              title="View Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#9A704B] text-white text-[10px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Drawer Trigger */}
          <button
            onClick={openCart}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-md bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-medium transition-colors shadow-sm"
            aria-label="Open Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bag</span>
            {itemCount > 0 && (
              <span className="bg-[#9A704B] text-white text-[11px] font-bold rounded-full px-1.5 py-0.2">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md border border-[#E8E4DC] text-[#24231F]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E4DC] bg-white p-4 space-y-3 font-sans text-sm">
          {onSearchChange && (
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#81796D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, author, or topic..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-md pl-9 pr-3 py-2 text-xs text-[#24231F] focus:outline-none"
              />
            </div>
          )}
          <Link
            href="/#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            All Titles
          </Link>
          <Link
            href="/category/programming"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            Topical Categories
          </Link>
          <Link
            href="/#bestsellers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            Bestsellers
          </Link>
          <Link
            href="/#bundles"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            Curated Bundles
          </Link>
          <Link
            href="/mission"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            Our Mission
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#24231F] font-medium border-b border-[#E8E4DC]"
          >
            About & Support
          </Link>
          <div className="pt-2 flex items-center justify-between text-xs text-[#6E685F]">
            <span>Currency: <strong>{currency}</strong></span>
            {onToggleCurrency && (
              <button
                onClick={onToggleCurrency}
                className="text-[#9A704B] font-semibold underline"
              >
                Switch
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
