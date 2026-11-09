'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { PaymentGatewayType } from '@/lib/payments/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { trackInitiateCheckout } from '@/lib/analytics';

interface CartDrawerProps {
  onStartCheckout: (orderData: any, gateway: PaymentGatewayType) => void;
}

export default function CartDrawer({ onStartCheckout }: CartDrawerProps) {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    clearCart,
    subtotalInr,
    discountInr,
    totalInr,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const selectedGateway: PaymentGatewayType = 'FAMPAY';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
      toast.success(`Coupon "${couponInput.toUpperCase()}" checked!`);
    }
  };

  const handleRemoveItem = (bookId: string, title: string) => {
    removeFromCart(bookId);
    toast.info(`Removed from bag`, {
      description: title.slice(0, 40),
    });
  };

  const handleClearBag = () => {
    clearCart();
    toast.info(`Bag emptied`);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerEmail || !customerEmail.includes('@')) {
      setCheckoutError('Please enter a valid email for order delivery');
      toast.error('Please enter a valid email for order delivery');
      return;
    }

    setCheckoutError(null);
    setIsSubmitting(true);

    try {
      trackInitiateCheckout(
        items.map(i => ({ id: i.bookId, name: i.title, price: i.priceInInr })),
        totalInr
      );

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerEmail,
          couponCode: appliedCoupon?.code,
          gateway: selectedGateway,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || 'Failed to create payment session');
      }

      closeCart();
      toast.success('UPI session initialized! Complete payment via any UPI app.');
      onStartCheckout(data.data, selectedGateway);
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment initiation failed');
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white border-l border-[#E8E4DC] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E4DC] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#9A704B]" />
            <h3 className="font-serif text-lg font-bold text-[#24231F]">Reading Bag</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] text-[#81796D] text-xs font-mono">
              {items.length} {items.length === 1 ? 'title' : 'titles'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClearBag}
                className="text-xs text-[#81796D] hover:text-rose-600 transition-colors"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-[#81796D] hover:text-[#24231F] hover:bg-[#FAF8F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center mx-auto text-[#81796D]">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="font-serif text-base font-bold text-[#24231F]">Your reading bag is empty</h4>
              <p className="text-xs text-[#81796D] max-w-xs mx-auto">
                Discover 18,500+ verified software engineering, computer science, and business manuals starting at ₹29.
              </p>
              <button
                onClick={closeCart}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#24231F] text-white text-xs font-medium hover:bg-[#3D3B35] transition-colors"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.bookId}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[#E8E4DC] bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="w-12 h-16 rounded overflow-hidden bg-white border border-[#E8E4DC] shrink-0">
                    <img
                      src={item.coverImage || '/covers/standard-shelf-cover.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/covers/standard-shelf-cover.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="font-serif text-xs font-semibold text-[#24231F] truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#81796D] truncate">
                      {item.author || 'AnonTrove Editorial'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-xs font-bold text-[#24231F]">
                        ₹{item.priceInInr}
                      </span>
                      <span className="text-[10px] text-[#81796D] uppercase font-mono">
                        {item.format || 'PDF'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.bookId, item.title)}
                  className="p-1 rounded text-[#81796D] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove from bag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8E4DC] bg-[#FAF8F5]/80 space-y-4">
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-[#81796D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Discount code (e.g. TROVE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E8E4DC] text-xs uppercase bg-white focus:outline-none focus:border-[#9A704B]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E4DC] hover:border-[#9A704B] text-xs font-medium text-[#24231F] transition-colors"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <span>Coupon {appliedCoupon.code} applied (-₹{discountInr})</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-[11px] underline text-emerald-800 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{couponError}</span>
                </p>
              )}
            </form>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-[#6E685F] border-t border-[#E8E4DC] pt-3">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} titles)</span>
                <span className="font-mono text-[#24231F]">₹{subtotalInr}</span>
              </div>
              {discountInr > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discountInr}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#24231F] pt-1.5 border-t border-[#E8E4DC]">
                <span>Total Due</span>
                <span className="font-serif text-base text-[#24231F]">₹{totalInr}</span>
              </div>
            </div>

            {/* Customer Delivery Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#6E685F] block">
                Delivery Email (receives order token & signed download):
              </label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] text-xs bg-white focus:outline-none focus:border-[#9A704B]"
              />
              {checkoutError && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{checkoutError}</span>
                </p>
              )}
            </div>

            {/* Instant UPI Pay Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#24231F] hover:bg-[#3D3B35] disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Creating UPI Session...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Pay ₹{totalInr} via Direct UPI</span>
                </>
              )}
            </button>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-[#81796D]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9A704B]" />
                Zero-Log UPI
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#9A704B]" />
                Instant Download Link
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
