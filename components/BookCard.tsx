'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Book } from '@/lib/catalog';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Eye, 
  ShoppingBag, 
  Zap, 
  Check, 
  Heart,
  Sparkles
} from 'lucide-react';

function resolveCoverSrc(book: Book): string {
  // Prefer absolute CDN cover URLs from the 86k index when present.
  if (book.coverImage && /^https?:\/\//i.test(book.coverImage)) {
    return book.coverImage;
  }
  // Otherwise route through /api/covers (local files + free APIs + precomputed index).
  return `/api/covers/${book.slug}?v=10`;
}

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
  const [imgSrc, setImgSrc] = useState<string>(() => resolveCoverSrc(book));
  const [imgError, setImgError] = useState(false);
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);

  useEffect(() => {
    setImgSrc(resolveCoverSrc(book));
    setImgError(false);
  }, [book.id, book.slug, book.coverImage]);

  const handleImageError = () => {
    if (!imgSrc.includes('/api/covers/')) {
      setImgSrc(`/api/covers/${book.slug}?v=10`);
      return;
    }
    // Do not disguise a missing cover with a generic shelf image.
    setImgError(true);
  };

  const displayPrice = currency === 'INR'
    ? `₹${book.priceInInr}`
    : `$${(book.priceInInr / 85).toFixed(2)}`;

  const displayOriginalPrice = currency === 'INR'
    ? `₹${book.originalPriceInInr}`
    : `$${(book.originalPriceInInr / 85).toFixed(2)}`;

  const savingsPercent = Math.round(
    ((book.originalPriceInInr - book.priceInInr) / book.originalPriceInInr) * 100
  );

  const handleAddToCart = () => {
    addToCart(book);
    toast.success(`Added to bag`, {
      description: `${book.title.slice(0, 42)}${book.title.length > 42 ? '...' : ''} • ${displayPrice}`,
      duration: 3000,
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(book);
      if (isWishlisted) {
        toast.info(`Removed from wishlist`, {
          description: book.title.slice(0, 40),
          duration: 2500,
        });
      } else {
        toast.success(`Saved to wishlist`, {
          description: book.title.slice(0, 40),
          duration: 2500,
        });
      }
    }
  };

  return (
    <article className="group relative bg-white border border-[#E8E4DC] hover:border-[#9A704B]/40 rounded-xl p-3.5 transition-all duration-300 flex flex-col justify-between shadow-book hover:shadow-book-hover hover:-translate-y-1">
      <div>
        {/* Cover Thumbnail with Link */}
        <Link 
          prefetch={false} 
          href={`/book/${book.slug}`} 
          className="block relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#E8E4DC] mb-3 group/cover"
        >
          {/* High-contrast authentic publisher hardcover background (NEVER blank) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E2330] via-[#141824] to-[#0A0D14] text-white flex flex-col justify-between p-3 select-none">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-sans font-medium uppercase tracking-wider text-emerald-400">
                  {book.format || 'PDF'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{book.pages > 0 ? `${book.pages}p` : 'Cover match pending'}</span>
            </div>
            <div className="my-auto py-2">
              <h4 className="font-serif text-[11px] font-bold text-white line-clamp-3 leading-snug">
                {book.title}
              </h4>
              <p className="text-[10px] text-amber-300/90 mt-1 line-clamp-1 italic font-serif">
                {book.author || 'Author not verified'}
              </p>
            </div>
            <div className="text-[9px] text-slate-400 font-mono tracking-wider uppercase border-t border-slate-700/60 pt-1.5 flex justify-between">
              <span>AnonTrove</span>
              <span className="text-amber-300">Cover unavailable</span>
            </div>
          </div>

          {/* Real cover image sits above placeholder; stay visible for cached loads */}
          {!imgError && (
            <img
              src={imgSrc}
              alt={book.title}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
              width={240}
              height={320}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
              className="absolute inset-0 z-10 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            />
          )}

          {/* Clean Editorial Badges (Aceternity / Magic UI pill pattern) */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-10">
            <span className="px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-wider bg-white/95 text-[#24231F] border border-[#E8E4DC] rounded-full shadow-sm backdrop-blur-sm">
              {book.format || 'PDF'}
            </span>
            {savingsPercent > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-sans font-bold text-[#835C3A] bg-[#FAF6F1]/95 border border-[#F2E8DC] rounded-full shadow-sm backdrop-blur-sm">
                -{savingsPercent}%
              </span>
            )}
          </div>

          {/* Interactive Wishlist Toggle */}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={handleWishlistClick}
              title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/95 hover:bg-white border border-[#E8E4DC] flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-110 active:scale-95"
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  isWishlisted ? "fill-rose-500 text-rose-500" : "text-[#81796D] hover:text-[#24231F]"
                )}
              />
            </button>
          )}

          {/* Subtle bottom shadow overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
          <span className="text-[10px] text-[#81796D] font-sans font-medium flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#9A704B]" />
            Instant Delivery
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {onSelectPreview ? (
            <button
              onClick={() => onSelectPreview(book)}
              className="py-1.5 px-2 rounded-lg border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E685F] hover:text-[#24231F] transition-all duration-150 flex items-center justify-center gap-1 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          ) : (
            <Link
              prefetch={false}
              href={`/book/${book.slug}`}
              className="py-1.5 px-2 rounded-lg border border-[#E8E4DC] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E685F] hover:text-[#24231F] transition-all duration-150 flex items-center justify-center gap-1 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>
          )}

          {onSelectBuy ? (
            <button
              onClick={() => onSelectBuy(book)}
              className="py-1.5 px-2 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Buy Now</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="py-1.5 px-2 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              {isInCart ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShoppingBag className="w-3.5 h-3.5" />}
              <span>{isInCart ? 'In Bag' : 'Add to Bag'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
