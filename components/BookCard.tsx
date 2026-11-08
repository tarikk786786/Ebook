'use client';

import React from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import { 
  BookOpen, 
  Eye, 
  ShoppingBag,
  Zap,
  Check,
  Heart
} from 'lucide-react';

interface BookCardProps {
  book: Book;
  currency?: 'INR' | 'USD';
  onSelectBuy?: (book: Book) => void;
  onSelectPreview?: (book: Book) => void;
  onToggleWishlist?: (book: Book) => void;
  isWishlisted?: boolean;
}

export default function BookCard({
  book,
  currency = 'INR',
  onSelectBuy,
  onSelectPreview,
  onToggleWishlist,
  isWishlisted = false,
}: BookCardProps) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  const savingsPercent = Math.round(
    ((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100
  );

  return (
    <article className="group bg-white border border-[#E8E4DC] hover:border-[#D5CEBE] rounded-lg p-3.5 transition-all duration-200 flex flex-col justify-between shadow-book hover:shadow-book-hover">
      <div>
        {/* Cover Thumbnail with Link */}
        <Link prefetch={false} href={`/book/${book.slug}`} className="block relative aspect-[3/4] w-full rounded overflow-hidden bg-[#FAF8F5] border border-[#E8E4DC] mb-3">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#F0EAE1] to-[#FAF8F5] animate-pulse" />
          )}

          {!imgError ? (
            <img
              src={book.coverImage}
              alt={book.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
              className={`w-full h-full object-cover object-center group-hover:scale-[1.02] transition-all duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-[#FAF8F5] flex flex-col justify-between p-4 border border-[#E8E4DC]">
              <div className="flex items-center space-x-1 text-[#81796D]">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider">
                  {book.format || 'PDF'}
                </span>
              </div>
              <div className="my-auto">
                <h4 className="font-serif text-xs font-semibold text-[#24231F] line-clamp-3 leading-snug">
                  {book.title}
                </h4>
                <p className="text-[11px] text-[#81796D] mt-1 line-clamp-1">{book.author}</p>
              </div>
              <div className="text-[10px] text-[#81796D] font-mono">
                {book.pages} Pages • DRM-Free
              </div>
            </div>
          )}

          {/* Clean Editorial Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
            <span className="px-1.5 py-0.5 text-[9px] font-sans font-medium uppercase tracking-wider bg-white/95 text-[#24231F] border border-[#E8E4DC] rounded shadow-sm">
              {book.format || 'PDF'}
            </span>
            {savingsPercent > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-sans font-semibold text-[#835C3A] bg-[#FAF6F1] border border-[#F2E8DC] rounded">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          {/* Interactive Wishlist Toggle */}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(book);
              }}
              title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white border border-[#E8E4DC] flex items-center justify-center transition-all shadow-sm hover:scale-105"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#81796D] hover:text-[#24231F]'
                }`}
              />
            </button>
          )}
        </Link>

        {/* Title & Author */}
        <div className="space-y-1">
          <Link prefetch={false} href={`/book/${book.slug}`} className="block">
            <h3 className="font-serif text-sm font-semibold text-[#24231F] group-hover:text-[#9A704B] transition-colors line-clamp-2 leading-snug">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-[#81796D] line-clamp-1 font-sans">
            By <span className="text-[#5B5449]">{book.author || 'AnonTrove Editorial'}</span>
          </p>
        </div>
      </div>

      {/* Pricing & CTA Controls */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]/80 space-y-2.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-base font-bold text-[#24231F]">{displayPrice}</span>
            {book.originalPriceInInr > book.priceInInr && (
              <span className="text-xs text-[#81796D] line-through">{displayOriginalPrice}</span>
            )}
          </div>
          <span className="text-[10px] text-[#81796D] font-sans font-medium">Instant Access</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {onSelectPreview ? (
            <button
              onClick={() => onSelectPreview(book)}
              className="py-1.5 px-2 rounded border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E685F] hover:text-[#24231F] transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          ) : (
            <Link
              prefetch={false}
              href={`/book/${book.slug}`}
              className="py-1.5 px-2 rounded border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E685F] hover:text-[#24231F] transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>
          )}

          {onSelectBuy ? (
            <button
              onClick={() => onSelectBuy(book)}
              className="py-1.5 px-2 rounded bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          ) : (
            <button
              onClick={() => addToCart(book)}
              className="py-1.5 px-2 rounded bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              {isInCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
              <span>{isInCart ? 'In Bag' : 'Add to Bag'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
