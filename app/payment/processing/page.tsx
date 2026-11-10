'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

function ProcessingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
  const bookId = searchParams.get('book_id') || searchParams.get('bookId') || '';
  const [message, setMessage] = useState('Verifying payment with FamGateway…');
  const [busy, setBusy] = useState(false);

  const poll = useCallback(async () => {
    if (!orderId) {
      router.replace('/payment/failed?reason=missing_order');
      return;
    }
    setBusy(true);
    try {
      const qs = new URLSearchParams({ order_id: orderId });
      if (bookId) qs.set('book_id', bookId);
      const res = await fetch(`/api/poll?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();

      if (data.status === 'success' && data.token) {
        const successQs = new URLSearchParams({ order_id: orderId });
        if (bookId) successQs.set('book_id', bookId);
        if (data.utr) successQs.set('utr', data.utr);
        router.replace(`/payment/success?${successQs.toString()}`);
        return;
      }
      if (data.status === 'expired') {
        router.replace(`/payment/failed?order_id=${encodeURIComponent(orderId)}&reason=expired`);
        return;
      }
      if (data.status === 'failed') {
        router.replace(`/payment/failed?order_id=${encodeURIComponent(orderId)}&reason=failed`);
        return;
      }
      setMessage('Payment still pending. Waiting for FamGateway confirmation…');
    } catch {
      setMessage('Temporary verification issue. Retrying…');
    } finally {
      setBusy(false);
    }
  }, [orderId, bookId, router]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 4000);
    const timeout = setTimeout(() => {
      router.replace(`/payment/pending?order_id=${encodeURIComponent(orderId)}${bookId ? `&book_id=${encodeURIComponent(bookId)}` : ''}`);
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(t);
      clearTimeout(timeout);
    };
  }, [poll, orderId, bookId, router]);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        <h1 className="text-xl font-semibold">Payment Processing</h1>
        <p className="text-sm text-slate-400">{message}</p>
        <p className="text-[11px] text-slate-500 font-mono break-all">Order: {orderId || '—'}</p>
        <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400/90">
          <ShieldCheck className="w-3.5 h-3.5" />
          Server-side FamGateway verification only
        </div>
        <button
          onClick={poll}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-xs hover:border-cyan-500/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          Refresh status
        </button>
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
            Return to catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      <ProcessingInner />
    </Suspense>
  );
}
