'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Book } from '@/lib/catalog';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  DownloadCloud, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

export interface OrderData {
  orderId: string;
  orderNumber?: string;
  amount: string;
  qrUrl: string;
  checkoutUrl: string;
  upiIntent: string;
  upiId: string;
  title?: string;
  format?: string;
  fileSize?: string;
  coverImage?: string;
  items?: Array<{ bookId: string; title: string; priceInInr: number }>;
}

export interface PaymentModalProps {
  book?: Book | null;
  initialOrder?: OrderData | null;
  onClose: () => void;
}

export default function PaymentModal({ book, initialOrder, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState<boolean>(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(initialOrder || null);
  
  // Status states: 'pending' | 'success' | 'expired'
  const [status, setStatus] = useState<'pending' | 'success' | 'expired'>('pending');
  const [utr, setUtr] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<Array<{ bookId: string; title: string; downloadUrl: string }>>([]);
  
  // 10-minute countdown (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isManualChecking, setIsManualChecking] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize payment session
  const initPaymentSession = () => {
    if (initialOrder) {
      setOrder(initialOrder);
      setLoading(false);
      setError(null);
      setStatus('pending');
      setTimeLeft(600);
      return;
    }

    if (!book) return;

    setLoading(true);
    setError(null);
    setStatus('pending');
    setDownloadUrl(null);
    setDownloadItems([]);
    setTimeLeft(600);

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: book.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to initiate FamPay checkout session');
        return res.json();
      })
      .then((res) => {
        if (res.status === 'success' && res.data) {
          setOrder(res.data);
          setLoading(false);
        } else {
          throw new Error(res.error || 'Invalid FamPay gateway response');
        }
      })
      .catch((err) => {
        setError(err.message || 'Payment server unreachable');
        setLoading(false);
      });
  };

  useEffect(() => {
    initPaymentSession();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [book, initialOrder]);

  // Countdown timer
  useEffect(() => {
    if (loading || status === 'success' || status === 'expired') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, status]);

  // Polling verification against authoritative server
  const checkPayment = async () => {
    if (!order) return;
    try {
      setIsManualChecking(true);
      const targetBookId = book?.id || (order.items && order.items[0]?.bookId) || '';
      const pollUrl = `/api/poll?order_id=${encodeURIComponent(order.orderId)}${targetBookId ? `&book_id=${encodeURIComponent(targetBookId)}` : ''}`;
      
      const res = await fetch(pollUrl);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'success') {
        setStatus('success');
        setUtr(data.utr || 'VERIFIED-UPI');
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
        }
        if (data.downloadItems && Array.isArray(data.downloadItems)) {
          setDownloadItems(data.downloadItems);
        }
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      } else if (data.status === 'expired') {
        setStatus('expired');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    } catch {
      // Non-blocking on network jitter
    } finally {
      setIsManualChecking(false);
    }
  };

  useEffect(() => {
    if (!order || status !== 'pending') return;

    pollIntervalRef.current = setInterval(checkPayment, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [order, status, book]);

  if (!book && !order) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyUpi = () => {
    if (!order?.upiId) return;
    navigator.clipboard.writeText(order.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const title = book?.title || order?.title || 'Purchased eBook';
  const format = book?.format || order?.format || 'PDF';
  const fileSize = book?.fileSize || order?.fileSize || 'Standard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#111724] border border-slate-800 rounded-lg shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/70">
          <div className="flex items-center space-x-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              FamPay UPI Checkout
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Connecting to FamPay UPI Rail...</p>
              <p className="text-xs text-slate-500 font-mono">Generating dynamic session...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-full text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Payment Session Failed</h3>
              <p className="text-xs text-slate-400 max-w-xs">{error}</p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={initPaymentSession}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 rounded-xl flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : status === 'success' ? (
            /* Success State */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  Payment Verified
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Purchase Confirmed</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Your payment of <strong className="text-white">₹{order?.amount}</strong> has been confirmed by bank settlement.
                </p>
              </div>

              <div className="w-full bg-[#0B0F17] p-3.5 rounded-xl border border-slate-800 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Order Ref:</span>
                  <span className="text-slate-200">{order?.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bank UTR:</span>
                  <span className="text-emerald-400 font-semibold">{utr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Security Token:</span>
                  <span className="text-slate-200">Single-Use (24 Hours)</span>
                </div>
              </div>

              {downloadItems.length > 1 ? (
                <div className="w-full space-y-2">
                  <span className="text-xs font-bold text-white block text-left">Your Downloads:</span>
                  {downloadItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.downloadUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-between transition-colors"
                    >
                      <span className="truncate mr-2">{item.title}</span>
                      <DownloadCloud className="w-4 h-4 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : downloadUrl ? (
                <a
                  href={downloadUrl}
                  download={book ? book.fileName : 'ebook.pdf'}
                  className="w-full py-3 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <DownloadCloud className="w-5 h-5" />
                  <span>Download eBook ({format})</span>
                </a>
              ) : null}

              <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero trackers used. Single-use AES-256 token.</span>
              </p>
            </div>
          ) : status === 'expired' ? (
            /* Expired State */
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-full text-amber-400">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Payment Session Expired</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                The 10-minute UPI reservation expired. Please restart checkout.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={initPaymentSession}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 rounded-xl flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start New Session</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Active FamPay UPI Checkout State */
            <div className="space-y-4">
              {/* Product and Price Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="max-w-[240px]">
                  <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                  <p className="text-xs text-slate-400">{format} • {fileSize}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    ₹{order?.amount}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">0% Fee Direct UPI</span>
                </div>
              </div>

              {/* Dynamic QR Code Box */}
              <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-lg shadow-inner relative">
                {order?.qrUrl ? (
                  <img
                    src={order.qrUrl}
                    alt={`Scan UPI QR to pay ₹${order.amount}`}
                    className="w-48 h-48 object-contain rounded-md"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-md text-slate-400 text-xs">
                    QR Unavailable
                  </div>
                )}
                <div className="mt-1 flex items-center space-x-1 text-slate-800 font-mono font-bold text-xs">
                  <span>Pay:</span>
                  <span className="text-slate-900 font-bold">₹{order?.amount}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Scan using FamPay or any UPI app
                </span>
              </div>

              {/* Mobile UPI App Intent Button */}
              {order?.upiIntent && (
                <a
                  href={order.upiIntent}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Pay via FamPay / UPI App (₹{order.amount})</span>
                </a>
              )}

              {/* UPI ID copy fallback */}
              {order?.upiId && (
                <div className="flex items-center justify-between bg-[#0B0F17] px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="truncate mr-2">
                    <span className="text-slate-500 text-[10px] font-mono block">Direct UPI VPA:</span>
                    <span className="font-mono text-slate-300 text-xs tracking-wide">
                      {order.upiId.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '***' + c)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy VPA'}</span>
                  </button>
                </div>
              )}

              {/* Countdown & Polling Indicator */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires:</span>
                  <span className="font-mono font-bold text-amber-400">{formatTimer(timeLeft)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] font-medium">Detecting payment...</span>
                </div>
              </div>

              {/* Manual Verification Trigger */}
              <button
                type="button"
                onClick={checkPayment}
                disabled={isManualChecking}
                className="w-full py-2.5 px-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 text-xs font-medium flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isManualChecking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Verifying with Bank...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>I have paid — Check Status Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#0B0F17]/80 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Secured via FamPay UPI</span>
          <span>Zero-Trace Encryption</span>
        </div>
      </div>
    </div>
  );
}
