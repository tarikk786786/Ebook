'use client';

import React from 'react';
import Link from 'next/link';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';

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
  onSelectBuy
}: WishlistDrawerProps) {
  const { addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E8E4DC] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[#E8E4DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#9A704B]" />
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
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center mx-auto text-[#81796D]">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-semibold text-[#24231F]">Your list is empty</h4>
                <p className="text-xs text-[#6E685F] max-w-xs mx-auto">
                  Click the heart icon on any book card to save titles for later reading.
                </p>
              </div>
            ) : (
              wishlist.map((book) => (
                <div 
                  key={book.id}
                  className="flex gap-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-3 hover:border-[#D5CEBE] transition-colors"
                >
                  <div className="w-14 h-18 aspect-[3/4] bg-white rounded overflow-hidden shrink-0 border border-[#E8E4DC]">
                    <img
                      src={book.coverImage || `/api/covers/${book.slug}`}
                      alt={book.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `/api/covers/${book.slug}`;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-xs font-semibold text-[#24231F] line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-[#81796D] line-clamp-1">{book.author}</p>
                      <span className="font-serif text-xs font-bold text-[#24231F] block mt-1">
                        ₹{book.priceInInr}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          addToCart(book);
                          onRemove(book.id);
                        }}
                        className="py-1 px-2.5 bg-[#24231F] text-white text-[11px] font-medium rounded hover:bg-[#3D3B35] transition-colors flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Bag</span>
                      </button>

                      <button
                        onClick={() => onRemove(book.id)}
                        className="p-1 text-[#81796D] hover:text-rose-600 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {wishlist.length > 0 && (
            <div className="p-4 border-t border-[#E8E4DC] bg-[#FAF8F5]">
              <button
                onClick={() => {
                  wishlist.forEach((b) => {
                    addToCart(b);
                  });
                  onClose();
                }}
                className="w-full py-2.5 bg-[#24231F] hover:bg-[#3D3B35] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Move All to Reading Bag</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
