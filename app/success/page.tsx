'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getBookById } from '@/lib/catalog';
import { 
  CheckCircle2, 
  DownloadCloud, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('book_id') || '';
  const orderId = searchParams.get('order_id') || '';
  
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<Array<{ bookId: string; title: string; downloadUrl: string }>>([]);
  const [utr, setUtr] = useState<string>('');
  const [orderAmount, setOrderAmount] = useState<string>('');

  const book = bookId ? getBookById(bookId) : null;

  const verifyPayment = async () => {
    if (!orderId) {
      setErrorMessage('No order reference provided in callback.');
      setStatus('failed');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/poll?order_id=${encodeURIComponent(orderId)}${bookId ? `&book_id=${encodeURIComponent(bookId)}` : ''}`);
      const data = await res.json();

      if (data.status === 'success' && data.token) {
        setStatus('verified');
        setDownloadUrl(data.downloadUrl);
        if (data.downloadItems) {
          setDownloadItems(data.downloadItems);
        }
        if (data.utr) setUtr(data.utr);
        if (data.amount) setOrderAmount(data.amount);
      } else if (data.status === 'expired') {
        setStatus('failed');
        setErrorMessage('Payment session expired. Please return to catalog and try again.');
      } else {
        // Still pending
        setStatus('pending');
      }
    } catch (e: any) {
      setStatus('pending');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();

    // Auto-poll every 3 seconds if status is still pending
    const interval = setInterval(() => {
      if (status === 'pending') {
        verifyPayment();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, bookId, status]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-[#121826] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {status === 'verified' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-in zoom-in-75">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                Authoritative Bank Settlement Verified
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">Payment Completed!</h1>
              <p className="text-xs text-slate-400 mt-1">
                Your purchase has been confirmed on the UPI rail.
              </p>
            </div>

            <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Order Reference:</span>
                <span className="text-slate-200">{orderId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank UTR / Transaction:</span>
                <span className="text-emerald-400 font-semibold">{utr || 'VERIFIED-UPI'}</span>
              </div>
              {orderAmount && (
                <div className="flex justify-between text-slate-400">
                  <span>Settlement Amount:</span>
                  <span className="text-slate-200">₹{orderAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Token Stream:</span>
                <span className="text-slate-200">AES-256-GCM (24h Single-Use)</span>
              </div>
            </div>

            {/* Downloads */}
            <div className="space-y-3">
              {downloadItems.length > 1 ? (
                <div className="space-y-2 text-left">
                  <p className="text-xs font-semibold text-slate-300">Purchased Volumes in Order:</p>
                  {downloadItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.downloadUrl}
                      download
                      className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500 text-slate-200 hover:text-white text-xs font-medium flex items-center justify-between transition-colors"
                    >
                      <span className="truncate mr-2">{item.title}</span>
                      <DownloadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    </a>
                  ))}
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

              {book && (
                <Link
                  href={`/book/${book.slug}/read`}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Open in Browser Reader</span>
                </Link>
              )}
            </div>
          </>
        ) : status === 'pending' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded">
                Awaiting Bank Settlement
              </span>
              <h1 className="text-xl font-bold text-white mt-2">Confirming Payment...</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                We are actively querying the UPI banking rail for order <code className="text-slate-300 font-mono">{orderId}</code>. This typically takes 5–15 seconds after UPI app approval.
              </p>
            </div>

            <button
              onClick={verifyPayment}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl inline-flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Check Verification Now</span>
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded">
                Unverified Transaction
              </span>
              <h1 className="text-xl font-bold text-white mt-2">Payment Not Confirmed</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {errorMessage || 'The payment could not be authoritatively verified by the banking gateway.'}
              </p>
            </div>
          </>
        )}

        <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-Custodial Direct Settlement • Zero PII Leak</span>
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
