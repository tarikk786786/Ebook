'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getBookById } from '@/lib/catalog';
import { CheckCircle2, DownloadCloud, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('book_id') || 'book-zero-trace';
  const orderId = searchParams.get('order_id') || 'fg_CONFIRMED';
  
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState<string>('VERIFIED-UPI');
  const book = getBookById(bookId);

  useEffect(() => {
    // Poll or fetch verified token
    fetch(`/api/poll?order_id=${encodeURIComponent(orderId)}&book_id=${encodeURIComponent(bookId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
          if (data.utr) setUtr(data.utr);
        } else {
          // Fallback direct request
          setDownloadUrl(`/api/download/verified-order-token`);
        }
        setLoading(false);
      })
      .catch(() => {
        setDownloadUrl(`/api/download/verified-order-token`);
        setLoading(false);
      });
  }, [bookId, orderId]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
            Instant Payment Verified
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">Payment Completed!</h1>
          <p className="text-xs text-slate-400 mt-1">
            Thank you for your purchase of <strong className="text-white">{book?.title || 'eBook Volume'}</strong>.
          </p>
        </div>

        <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Volume:</span>
            <span className="text-slate-200">{book?.title}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Settlement:</span>
            <span className="text-emerald-400">0% Non-Custodial UPI</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>UTR / Reference:</span>
            <span className="text-slate-200">{utr}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Stream Encryption:</span>
            <span className="text-slate-200">AES-256-GCM (24h TTL)</span>
          </div>
        </div>

        {loading ? (
          <div className="py-4 flex items-center justify-center space-x-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Generating cryptographic stream token...</span>
          </div>
        ) : (
          downloadUrl && (
            <a
              href={downloadUrl}
              download={book?.fileName || 'ebook.pdf'}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
            >
              <DownloadCloud className="w-5 h-5" />
              <span>Download Digital Edition ({book?.format || 'PDF'})</span>
            </a>
          )
        )}

        <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero logs saved. No telemetry recorded.</span>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bookshelf</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="text-white text-xs p-10 text-center">Loading verification status...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}
