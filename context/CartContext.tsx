'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Book } from '@/lib/catalog';
import { CartItem, CouponDiscount } from '@/lib/payments/types';

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  couponCode: string;
  appliedCoupon: CouponDiscount | null;
  couponError: string | null;
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'anontrove_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [items]);

  const subtotalInr = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.priceInInr * item.quantity), 0);
  }, [items]);

  const discountInr = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      return Math.round((subtotalInr * appliedCoupon.discountValue) / 100);
    }
    return Math.min(appliedCoupon.discountValue, subtotalInr);
  }, [appliedCoupon, subtotalInr]);

  const totalInr = Math.max(1, subtotalInr - discountInr);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (book: Book) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bookId === book.id);
      if (existing) {
        return prev; // Digital items are 1-quantity per order
      }
      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          priceInInr: book.priceInInr,
          originalPriceInInr: book.originalPriceInInr,
          format: book.format,
          coverImage: book.coverImage,
          fileName: book.fileName,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const applyCoupon = (code: string) => {
    setCouponError(null);
    const upper = code.trim().toUpperCase();
    if (!upper) return;

    // Client-side quick check (server validates authoritatively)
    const validCodes: Record<string, { type: 'PERCENTAGE' | 'FIXED_INR'; value: number; minOrder: number }> = {
      WELCOME10: { type: 'PERCENTAGE', value: 10, minOrder: 50 },
      STUDENT20: { type: 'PERCENTAGE', value: 20, minOrder: 99 },
      MEGA50: { type: 'PERCENTAGE', value: 50, minOrder: 299 },
      DEV10: { type: 'PERCENTAGE', value: 10, minOrder: 0 },
      SAVE25: { type: 'FIXED_INR', value: 25, minOrder: 75 },
    };

    const c = validCodes[upper];
    if (!c) {
      setCouponError('Invalid coupon code. Try DEV10 or STUDENT20.');
      return;
    }
    if (subtotalInr < c.minOrder) {
      setCouponError(`Minimum order of ₹${c.minOrder} required for ${upper}.`);
      return;
    }

    const discountAmount = c.type === 'PERCENTAGE'
      ? Math.round((subtotalInr * c.value) / 100)
      : Math.min(c.value, subtotalInr);

    setAppliedCoupon({
      code: upper,
      discountType: c.type,
      discountValue: c.value,
      minOrderInr: c.minOrder,
      appliedDiscountInr: discountAmount,
    });
    setCouponCode(upper);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        couponCode,
        appliedCoupon,
        couponError,
        subtotalInr,
        discountInr,
        totalInr,
        itemCount,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
