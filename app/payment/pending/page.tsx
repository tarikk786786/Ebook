'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react';

function PendingInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const bookId = searchParams.get('book_id') || '';

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-800/50 bg-amber-950/20 p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-300">
          <Clock className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Payment Pending</h1>
        </div>
        <p className="text-sm text-slate-300">
          We have not received confirmed FamGateway clearance yet. If you completed UPI payment, verification may still be
          catching up. Your ebook unlocks only after server-side confirmation.
        </p>
        {orderId ? <p className="text-[11px] font-mono text-slate-500 break-all">Order: {orderId}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/payment/processing?order_id=${encodeURIComponent(orderId)}${bookId ? `&book_id=${encodeURIComponent(bookId)}` : ''}`}
            className="px-4 py-2 rounded-xl bg-cyan-700 text-sm"
          >
            Continue checking
          </Link>
          {bookId ? (
            <Link
              href={`/checkout?bookId=${encodeURIComponent(bookId)}`}
              className="px-4 py-2 rounded-xl border border-slate-700 text-sm"
            >
              Start a new checkout
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      <PendingInner />
    </Suspense>
  );
}
