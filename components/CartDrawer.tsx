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
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('RAZORPAY');
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0D121D] border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Your Reading Cart</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">Your cart is empty</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore over 1,668+ curated e-books, guides, and courses starting at just ₹29.
              </p>
              <button
                onClick={closeCart}
                className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
              >
                Start Exploring
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.bookId}
                  className="flex items-center space-x-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-12 h-16 object-cover rounded-md bg-slate-950 border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white line-clamp-1">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-1">By {item.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ₹{item.priceInInr}
                      </span>
                      <span className="text-[10px] text-slate-500 line-through">
                        ₹{item.originalPriceInInr}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {item.format}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.bookId)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear all items
                </button>
              </div>

              {/* Coupon Section */}
              <div className="pt-3 border-t border-slate-800/80">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs">
                    <div className="flex items-center space-x-2 text-emerald-300 font-mono">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} Applied: -₹{appliedCoupon.appliedDiscountInr}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-400 hover:text-white font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. DEV10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 uppercase font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Customer Email Input */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 block">
                  Delivery Email Address (Required for Receipt & DRM-Free Token):
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Payment Gateway Selector */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="text-[11px] font-mono text-slate-400 block">
                  Select Payment Gateway:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('RAZORPAY')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedGateway === 'RAZORPAY'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[11px] font-bold block">Razorpay</span>
                    <span className="text-[9px] text-slate-400 block">Cards / UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('CASHFREE')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedGateway === 'CASHFREE'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[11px] font-bold block">Cashfree</span>
                    <span className="text-[9px] text-slate-400 block">UPI / NetBank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('FAMGATEWAY')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedGateway === 'FAMGATEWAY'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-[11px] font-bold block">0% UPI QR</span>
                    <span className="text-[9px] text-slate-400 block">Peer-to-Peer</span>
                  </button>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#090D14] border-t border-slate-800 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({items.length} items):</span>
                <span>₹{subtotalInr}</span>
              </div>
              {discountInr > 0 && (
                <div className="flex justify-between text-emerald-400 font-mono">
                  <span>Discount:</span>
                  <span>-₹{discountInr}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800/80">
                <span>Total Amount:</span>
                <span className="text-emerald-400 font-mono text-base font-black">₹{totalInr}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Secure Session...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{totalInr} via {selectedGateway}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>256-Bit Encrypted</span>
              </span>
              <span>100% DRM-Free Ownership</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
