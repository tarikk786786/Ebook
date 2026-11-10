'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, DownloadCloud, BookOpen, Loader2, ShieldCheck } from 'lucide-react';
import { getBookById } from '@/lib/catalog';

function SuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const bookId = searchParams.get('book_id') || '';
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [utr, setUtr] = useState(searchParams.get('utr') || '');
  const [amount, setAmount] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [readerToken, setReaderToken] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<Array<{ bookId: string; title: string; downloadUrl: string }>>([]);
  const [title, setTitle] = useState('');

  const book = bookId ? getBookById(bookId) : null;

  const verify = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const qs = new URLSearchParams({ order_id: orderId });
      if (bookId) qs.set('book_id', bookId);
      const res = await fetch(`/api/poll?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'success' && data.token) {
        setVerified(true);
        setDownloadUrl(data.downloadUrl);
        setReaderToken(data.token);
        setTitle(data.bookTitle || book?.title || '');
        if (data.utr) setUtr(data.utr);
        if (data.amount) setAmount(String(data.amount));
        if (data.downloadItems) setDownloadItems(data.downloadItems);
        try {
          const raw = localStorage.getItem('anontrove_customer_orders');
          const list = raw ? JSON.parse(raw) : [];
          list.unshift({
            orderId,
            paidAt: new Date().toISOString(),
            amount: data.amount,
            items: data.downloadItems || [{ bookId, title: data.bookTitle, downloadUrl: data.downloadUrl }],
          });
          localStorage.setItem('anontrove_customer_orders', JSON.stringify(list.slice(0, 50)));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, bookId, book?.title]);

  useEffect(() => {
    verify();
  }, [verify]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B12] text-slate-300 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Confirming entitlement…
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-[#070B12] text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6 space-y-3 text-center">
          <h1 className="text-xl font-semibold">Payment not verified yet</h1>
          <p className="text-sm text-slate-400">
            This success URL does not unlock ebooks by itself. Waiting for FamGateway confirmation.
          </p>
          <Link
            href={`/payment/processing?order_id=${encodeURIComponent(orderId)}${bookId ? `&book_id=${encodeURIComponent(bookId)}` : ''}`}
            className="inline-flex px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
          >
            Continue verification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-6 h-6" />
            <h1 className="text-2xl font-semibold">Payment Successful</h1>
          </div>
          <p className="text-sm text-slate-300">{title || book?.title || 'Your ebook'} is unlocked.</p>
          <div className="text-xs text-slate-400 space-y-1 font-mono">
            <div>Order: {orderId}</div>
            {amount ? <div>Amount: ₹{amount}</div> : null}
            {utr ? <div>UTR / Txn: {utr}</div> : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-slate-950 text-sm font-medium"
              >
                <DownloadCloud className="w-4 h-4" /> Download
              </a>
            )}
            {readerToken && (
              <Link
                href={`/reader/${readerToken}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-sm"
              >
                <BookOpen className="w-4 h-4" /> Read online
              </Link>
            )}
            <Link href="/library" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300">
              My library
            </Link>
          </div>
          {downloadItems.length > 1 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              {downloadItems.map((item) => (
                <a key={item.bookId} href={item.downloadUrl} className="block text-sm text-cyan-300 hover:underline">
                  Download {item.title}
                </a>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified via FamGateway — download token expires in 15 minutes
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      <SuccessInner />
    </Suspense>
  );
}
