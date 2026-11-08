'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { PaymentGatewayType } from '@/lib/payments/types';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
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
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerEmail || !customerEmail.includes('@')) {
      setCheckoutError('Please enter a valid email for order delivery');
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
      onStartCheckout(data.data, selectedGateway);
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment initiation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
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
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-[#81796D] hover:text-[#24231F] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center mx-auto text-[#81796D]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-base font-bold text-[#24231F]">Your reading bag is empty</h4>
              <p className="text-xs text-[#6E685F] max-w-xs mx-auto">
                Explore over 12,192+ verified e-books, technical guides, and manuals starting at just ₹29.
              </p>
              <button
                onClick={closeCart}
                className="mt-3 px-4 py-2 bg-[#24231F] hover:bg-[#3D3B35] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.bookId}
                  className="flex items-center space-x-3 p-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl hover:border-[#D5CEBE] transition-colors"
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded bg-white border border-[#E8E4DC] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-xs font-bold text-[#24231F] line-clamp-1">{item.title}</h5>
                    <p className="text-[11px] text-[#81796D] line-clamp-1">By {item.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-serif text-xs font-bold text-[#24231F]">
                        ₹{item.priceInInr}
                      </span>
                      {item.originalPriceInInr > item.priceInInr && (
                        <span className="text-[10px] text-[#81796D] line-through">
                          ₹{item.originalPriceInInr}
                        </span>
                      )}
                      <span className="text-[9px] uppercase font-sans font-medium px-1.5 py-0.2 rounded bg-white border border-[#E8E4DC] text-[#81796D]">
                        {item.format || 'PDF'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.bookId)}
                    className="p-1.5 text-[#81796D] hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-[#81796D] hover:text-[#24231F] transition-colors"
                >
                  Clear reading bag
                </button>
              </div>

              {/* Coupon Section */}
              <div className="pt-3 border-t border-[#E8E4DC]">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-[#FAF6F1] border border-[#F2E8DC] rounded-xl text-xs">
                    <div className="flex items-center space-x-2 text-[#835C3A] font-mono">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} Applied: -₹{appliedCoupon.appliedDiscountInr}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[#9A704B] hover:text-[#24231F] font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-3 py-1.5 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#24231F] text-white text-xs font-medium rounded-lg hover:bg-[#3D3B35] transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8E4DC] bg-[#FAF8F5] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6E685F]">
                <span>Subtotal ({items.length} titles)</span>
                <span>₹{subtotalInr}</span>
              </div>
              {discountInr > 0 && (
                <div className="flex justify-between text-[#835C3A] font-medium">
                  <span>Savings Applied</span>
                  <span>-₹{discountInr}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-serif font-bold text-[#24231F] pt-2 border-t border-[#E8E4DC]">
                <span>Total Amount</span>
                <span>₹{totalInr}</span>
              </div>
            </div>

            {/* Email for Delivery */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#5B5449]">
                Email for Instant Delivery & In-Browser Reader Access
              </label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-white border border-[#E8E4DC] rounded-lg px-3 py-2 text-xs text-[#24231F] focus:outline-none focus:border-[#9A704B]"
              />
              <span className="text-[10px] text-[#81796D] block">
                Download link and receipt are delivered here instantly.
              </span>
            </div>

            {checkoutError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#24231F] hover:bg-[#3D3B35] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Proceed to UPI & Card Checkout (₹{totalInr})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-[#81796D]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#9A704B]" /> 256-Bit Encrypted
              </span>
              <span>•</span>
              <span>Instant PDF Access</span>
              <span>•</span>
              <span>UPI / Card</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
