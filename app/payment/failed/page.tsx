'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

function FailedInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const bookId = searchParams.get('book_id') || '';
  const reason = searchParams.get('reason') || 'failed';

  const message =
    reason === 'expired'
      ? 'This FamGateway payment session expired (typically ~5 minutes). Create a new checkout to try again.'
      : reason === 'missing_order'
        ? 'No order reference was provided.'
        : 'Payment was not completed or could not be verified.';

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-rose-800/50 bg-rose-950/20 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-300">
          <AlertCircle className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Payment Failed</h1>
        </div>
        <p className="text-sm text-slate-300">{message}</p>
        {orderId ? <p className="text-[11px] font-mono text-slate-500 break-all">Order: {orderId}</p> : null}
        <div className="flex flex-wrap gap-2">
          {bookId ? (
            <Link
              href={`/checkout?bookId=${encodeURIComponent(bookId)}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 text-sm font-medium"
            >
              Retry payment
            </Link>
          ) : (
            <Link href="/" className="px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 text-sm font-medium">
              Return to catalogue
            </Link>
          )}
          {orderId ? (
            <Link
              href={`/payment/processing?order_id=${encodeURIComponent(orderId)}${bookId ? `&book_id=${encodeURIComponent(bookId)}` : ''}`}
              className="px-4 py-2 rounded-xl border border-slate-700 text-sm"
            >
              Re-check status
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      <FailedInner />
    </Suspense>
  );
}
