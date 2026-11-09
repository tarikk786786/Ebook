'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans, sans-serif)',
            borderRadius: '12px',
            border: '1px solid rgba(229, 225, 213, 0.6)',
            boxShadow: '0 10px 25px -5px rgba(36, 35, 31, 0.1), 0 8px 10px -6px rgba(36, 35, 31, 0.05)',
          },
        }}
      />
    </CartProvider>
  );
}
