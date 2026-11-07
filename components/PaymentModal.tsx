'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Book } from '@/lib/catalog';
import { 
  X, 
  QrCode, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  DownloadCloud, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Globe,
  ArrowRight
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
  const [activeTab, setActiveTab] = useState<'qr' | 'redirect'>('qr');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize payment session if not provided directly
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setLoading(false);
      setError(null);
      setStatus('pending');
      setTimeLeft(600);
      return;
    }

    if (!book) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setStatus('pending');
    setDownloadUrl(null);
    setTimeLeft(600);

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: book.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to initiate checkout session');
        return res.json();
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.status === 'success' && res.data) {
          setOrder(res.data);
          setLoading(false);
        } else {
          throw new Error(res.error || 'Invalid gateway response');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Payment server unavailable');
        setLoading(false);
      });

    return () => {
      isMounted = false;
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
        setDownloadUrl(data.downloadUrl);
        if (data.downloadItems && Array.isArray(data.downloadItems)) {
          setDownloadItems(data.downloadItems);
        }
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      } else if (data.status === 'expired') {
        setStatus('expired');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    } catch {
      // Silent fail on transient poll errors
    } finally {
      setIsManualChecking(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!order || status !== 'pending') return;

    pollIntervalRef.current = setInterval(checkPayment, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [order, status, book]);

  if (!book && !initialOrder) return null;

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

  // Dedicated UPI Deep-link schemes
  const getPhonePeIntent = (upi: string) => upi.replace(/^upi:/i, 'phonepe:');
  const getGPayIntent = (upi: string) => upi.replace(/^upi:\/\/pay/i, 'gpay://upi/pay');
  const getPaytmIntent = (upi: string) => upi.replace(/^upi:/i, 'paytmmp:');

  const title = book?.title || order?.title || 'Premium eBook Collection';
  const format = book?.format || order?.format || 'PDF / EPUB';
  const fileSize = book?.fileSize || order?.fileSize || 'Instant Delivery';
  const amount = order?.amount || (book ? book.priceInInr.toFixed(2) : '49.00');

  // Dev simulation tool to test complete flow without live bank credentials
  const handleSimulatePayment = () => {
    setStatus('success');
    setUtr('SIMULATED_UTR_' + Math.random().toString(36).substring(2, 10).toUpperCase());
    
    const targetBookId = book?.id || (order?.items && order.items[0]?.bookId) || 'book-zero-trace';
    fetch(`/api/poll?order_id=${encodeURIComponent(order?.orderId || 'fg_test')}&book_id=${encodeURIComponent(targetBookId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.downloadUrl) {
          setDownloadUrl(d.downloadUrl);
        } else {
          setDownloadUrl(`/api/download/dev-token`);
        }
        if (d.downloadItems) {
          setDownloadItems(d.downloadItems);
        }
      })
      .catch(() => {
        setDownloadUrl('/api/download/dev-token');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#121826] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/60">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Secure Checkout • Dynamic UPI & Redirect
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Generating Dynamic Session & UPI QR...</p>
              <p className="text-xs text-slate-500">Binding Exact Price: ₹{amount}</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-full text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Payment Session Failed</h3>
              <p className="text-xs text-slate-400 max-w-xs">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl"
              >
                Close & Try Again
              </button>
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
                <h3 className="text-xl font-bold text-white mt-2">Purchase Confirmed!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Your payment of <strong className="text-white">₹{order?.amount}</strong> has been verified successfully.
                </p>
              </div>

              <div className="w-full bg-[#0B0F17] p-3.5 rounded-xl border border-slate-800 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Order ID:</span>
                  <span className="text-slate-200">{order?.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bank UTR:</span>
                  <span className="text-emerald-400 font-semibold">{utr}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Settlement:</span>
                  <span className="text-slate-200">Non-Custodial Direct</span>
                </div>
              </div>

              {/* Single or Multi-Item Download Links */}
              {downloadItems && downloadItems.length > 1 ? (
                <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[11px] font-mono text-slate-400 block text-left">Your Unlocked Volumes:</span>
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
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  <DownloadCloud className="w-5 h-5" />
                  <span>Download eBook ({format})</span>
                </a>
              ) : null}

              <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero trackers used. Single-use 24h token.</span>
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
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 rounded-xl"
              >
                Create New Session
              </button>
            </div>
          ) : (
            /* Active QR / Redirect Option State */
            <div className="space-y-4">
              {/* Product and Required Price Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="max-w-[230px]">
                  <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                  <p className="text-xs text-slate-400">{format} • {fileSize}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    ₹{order?.amount}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-400 font-mono font-semibold">
                    Required Price
                  </span>
                </div>
              </div>

              {/* Mode Switcher: QR Code vs Redirect Options */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    activeTab === 'qr'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dynamic QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('redirect')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    activeTab === 'redirect'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Redirect Options</span>
                </button>
              </div>

              {activeTab === 'qr' ? (
                /* Dynamic QR Code Box */
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-inner relative">
                    {order?.qrUrl ? (
                      <img
                        src={order.qrUrl}
                        alt={`Scan UPI QR for ₹${order.amount}`}
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                        QR Unavailable
                      </div>
                    )}
                    <div className="mt-1 flex items-center space-x-1 text-slate-800 font-mono font-bold text-xs">
                      <span>Exact Amount:</span>
                      <span className="text-emerald-700 font-black">₹{order?.amount}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans">
                      Scan with PhonePe, GPay, Paytm, BHIM, Cred
                    </span>
                  </div>

                  {/* Mobile Deep-link Quick Buttons */}
                  {order?.upiIntent && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={getPhonePeIntent(order.upiIntent)}
                          className="py-2 px-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-purple-200 font-medium text-xs flex flex-col items-center justify-center space-y-0.5 transition-all active:scale-95"
                        >
                          <span className="font-bold text-[11px] tracking-tight">PhonePe</span>
                          <span className="text-[9px] text-purple-400 font-mono">₹{order.amount}</span>
                        </a>
                        <a
                          href={getGPayIntent(order.upiIntent)}
                          className="py-2 px-1 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-700/50 text-sky-200 font-medium text-xs flex flex-col items-center justify-center space-y-0.5 transition-all active:scale-95"
                        >
                          <span className="font-bold text-[11px] tracking-tight">Google Pay</span>
                          <span className="text-[9px] text-sky-400 font-mono">₹{order.amount}</span>
                        </a>
                        <a
                          href={getPaytmIntent(order.upiIntent)}
                          className="py-2 px-1 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-700/50 text-blue-200 font-medium text-xs flex flex-col items-center justify-center space-y-0.5 transition-all active:scale-95"
                        >
                          <span className="font-bold text-[11px] tracking-tight">Paytm</span>
                          <span className="text-[9px] text-blue-400 font-mono">₹{order.amount}</span>
                        </a>
                      </div>

                      <a
                        href={order.upiIntent}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Any Mobile UPI App</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Explicit Redirect Options View */
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
                        Browser & Hosted Checkout
                      </span>
                      <h5 className="text-xs font-bold text-white mt-0.5">
                        Direct Redirect Option (₹{order?.amount})
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Redirects directly to the official payment checkout page for cards, net banking, or web payment.
                      </p>
                    </div>

                    {order?.checkoutUrl && (
                      <a
                        href={order.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                      >
                        <span>Redirect to Hosted Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Mobile Deep-link Alternative */}
                  {order?.upiIntent && (
                    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                      <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold block">
                        Mobile App Intent Redirect
                      </span>
                      <a
                        href={order.upiIntent}
                        className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Launch UPI App Directly (₹{order.amount})</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Countdown & Polling Indicator */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires in:</span>
                  <span className="font-mono font-bold text-amber-400">{formatTimer(timeLeft)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] font-medium">Auto-detecting payment...</span>
                </div>
              </div>

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

              {/* Manual Verification Trigger */}
              <button
                type="button"
                onClick={checkPayment}
                disabled={isManualChecking}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 text-[11px] font-medium flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isManualChecking ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    <span>Verifying with Bank...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Paid on mobile? Click to verify instantly</span>
                  </>
                )}
              </button>

              {/* Dev Simulation Fallback */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="text-[10px] text-slate-600 hover:text-slate-400 font-mono underline transition-colors"
                >
                  [Dev/Staging: Simulate Instant Verification]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#0B0F17]/80 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Non-Custodial UPI & Redirect Rail</span>
          <span>Zero-Trace Encryption</span>
        </div>
      </div>
    </div>
  );
}
