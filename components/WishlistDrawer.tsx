'use client';

import React from 'react';
import Link from 'next/link';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Zap } from 'lucide-react';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Book[];
  onRemove: (id: string) => void;
  onSelectBuy?: (book: Book) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onRemove,
  onSelectBuy,
}: WishlistDrawerProps) {
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const handleMoveToCart = (book: Book) => {
    addToCart(book);
    onRemove(book.id);
    toast.success(`Moved to bag: ${book.title.slice(0, 36)}...`);
  };

  const handleRemove = (book: Book) => {
    onRemove(book.id);
    toast.info(`Removed from wishlist: ${book.title.slice(0, 36)}...`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E8E4DC] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[#E8E4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h3 className="font-serif text-lg font-bold text-[#24231F]">Saved Reading List</h3>
              <span className="text-xs bg-[#FAF8F5] border border-[#E8E4DC] text-[#81796D] px-2 py-0.5 rounded-full font-mono">
                {wishlist.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#81796D] hover:text-[#24231F] hover:bg-[#FAF8F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center mx-auto text-[#81796D]">
                  <Heart className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#24231F]">Your reading list is empty</h4>
                <p className="text-xs text-[#81796D] max-w-xs mx-auto">
                  Click the heart icon on any title to save it for later review or instant checkout.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#24231F] text-white text-xs font-medium hover:bg-[#3D3B35] transition-colors"
                >
                  <span>Explore Bestsellers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              wishlist.map((book) => (
                <div
                  key={book.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-all hover:border-[#9A704B]/30"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-white border border-[#E8E4DC] shrink-0">
                      <img
                        src={book.coverImage || `/api/covers/${book.slug}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/covers/standard-shelf-cover.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link
                        href={`/book/${book.slug}`}
                        onClick={onClose}
                        className="block font-serif text-xs font-semibold text-[#24231F] hover:text-[#9A704B] truncate"
                      >
                        {book.title}
                      </Link>
                      <p className="text-[11px] text-[#81796D] truncate">
                        {book.author || 'AnonTrove Editorial'}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-xs font-bold text-[#24231F]">
                          ₹{book.priceInInr}
                        </span>
                        <span className="text-[10px] text-[#81796D] uppercase font-mono">
                          {book.format || 'PDF'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => handleRemove(book)}
                      className="p-1 rounded text-[#81796D] hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveToCart(book)}
                      className="px-2 py-1 bg-[#24231F] hover:bg-[#3D3B35] text-white text-[10px] font-medium rounded-md flex items-center gap-1 transition-colors active:scale-95"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
