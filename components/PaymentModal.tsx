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
  RefreshCw,
  Lock,
  BookOpen
} from 'lucide-react';
import { trackPurchase } from '@/lib/analytics';

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
  gateway?: string;
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
      body: JSON.stringify({
        bookId: book.id,
        items: [{
          bookId: book.id,
          title: book.title,
          priceInInr: book.priceInInr,
          originalPriceInInr: book.originalPriceInInr,
          format: book.format,
          coverImage: book.coverImage,
          fileName: book.fileName,
        }],
        gateway: 'FAMPAY',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.data) {
          setOrder(data.data);
          setLoading(false);
        } else {
          setError(data.error || 'Failed to initialize payment gateway.');
          setLoading(false);
        }
      })
      .catch((err) => {
        setError('Connection failure connecting to checkout.');
        setLoading(false);
      });
  };

  useEffect(() => {
    initPaymentSession();
  }, [book, initialOrder]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending') return;

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
  }, [status]);

  // Status Poller
  const checkPayment = async () => {
    if (!order?.orderId) return;

    try {
      setIsManualChecking(true);
      const res = await fetch(`/api/poll?order_id=${encodeURIComponent(order.orderId)}&orderId=${encodeURIComponent(order.orderId)}`);
      const data = await res.json();

      const isStatusSuccess = data.status === 'COMPLETED' || data.status === 'SUCCESS' || data.status === 'success';

      if (isStatusSuccess) {
        setStatus('success');
        const resolvedUtr = data.utr || data.bankRef || 'UPI-' + Math.random().toString().slice(2, 10);
        setUtr(resolvedUtr);
        setDownloadUrl(data.downloadUrl);
        const resolvedItems = (data.items && Array.isArray(data.items)) 
          ? data.items 
          : (data.downloadItems && Array.isArray(data.downloadItems))
            ? data.downloadItems
            : (order.items && Array.isArray(order.items))
              ? order.items
              : [{ bookId: book?.id || 'book', title: title, price: Number(order.amount), format }];
        
        setDownloadItems(resolvedItems);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        // Securely persist verified order to customer's personal device storage
        try {
          if (typeof window !== 'undefined') {
            const rawSaved = localStorage.getItem('anontrove_customer_orders');
            const existingOrders = rawSaved ? JSON.parse(rawSaved) : [];
            const isAlreadySaved = existingOrders.some((o: any) => o.orderId === order.orderId || o.orderNumber === order.orderId);
            if (!isAlreadySaved) {
              const newOrderRecord = {
                orderId: order.orderId,
                orderNumber: order.orderId.startsWith('ORD-') ? order.orderId : `ORD-${order.orderId.slice(-6).toUpperCase()}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                amountInInr: Number(order.amount) || (book?.priceInInr || 49),
                gateway: (order as any).gateway || 'UPI',
                status: 'PAID',
                bankUtr: resolvedUtr,
                token: data.token || null,
                items: resolvedItems.map((it: any) => ({
                  bookId: it.bookId || book?.id,
                  title: it.title || it.name || title,
                  price: it.priceInInr || it.price || Number(order.amount),
                  format: it.format || format || 'PDF',
                  token: it.token || data.token || null,
                  downloadUrl: it.downloadUrl || data.downloadUrl || null,
                })),
              };
              existingOrders.unshift(newOrderRecord);
              localStorage.setItem('anontrove_customer_orders', JSON.stringify(existingOrders.slice(0, 50)));
            }
          }
        } catch (storageErr) {
          console.warn('[PaymentModal] Order save to client storage error:', storageErr);
        }

        // Fire analytics purchase event
        trackPurchase(
          order.orderId,
          order.items ? order.items.map(i => ({ id: i.bookId, name: i.title, price: i.priceInInr })) : [{ id: book?.id || 'book', name: title, price: Number(order.amount) }],
          Number(order.amount)
        );
      } else if (data.status === 'EXPIRED' || data.status === 'expired') {
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

  const title = book?.title || order?.title || 'Purchased Title';
  const format = book?.format || order?.format || 'PDF';
  const fileSize = book?.fileSize || order?.fileSize || 'Standard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-md bg-white border border-[#E8E4DC] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DC] bg-[#FAF8F5]">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#9A704B]" />
            <span className="font-serif text-sm font-bold text-[#24231F]">
              AnonTrove Secure Checkout
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#81796D] hover:text-[#24231F] hover:bg-white transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#9A704B] animate-spin" />
              <p className="text-sm text-[#24231F] font-serif font-medium">Generating Secure UPI Session...</p>
              <p className="text-xs text-[#81796D]">Connecting bank payment rail...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-full text-rose-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">Payment Session Failed</h3>
              <p className="text-xs text-[#6E685F] max-w-xs">{error}</p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={initPaymentSession}
                  className="px-4 py-2 bg-[#24231F] hover:bg-[#3D3B35] text-xs font-semibold text-white rounded-lg flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E8E4DC] bg-white text-xs font-medium text-[#24231F] rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : status === 'success' ? (
            /* Success State */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF6F1] border border-[#F2E8DC] flex items-center justify-center text-[#9A704B] animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#FAF6F1] text-[#9A704B] border border-[#F2E8DC] rounded">
                  Payment Verified
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#24231F] mt-2">Order Confirmed</h3>
                <p className="text-xs text-[#6E685F] mt-1 max-w-xs">
                  Your payment of <strong className="text-[#24231F]">₹{order?.amount}</strong> has been confirmed.
                </p>
              </div>

              <div className="w-full bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E4DC] text-left text-xs space-y-1 font-sans">
                <div className="flex justify-between text-[#6E685F]">
                  <span>Order Ref:</span>
                  <span className="font-mono text-[#24231F]">{order?.orderId}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Bank UTR:</span>
                  <span className="font-mono font-semibold text-[#24231F]">{utr}</span>
                </div>
                <div className="flex justify-between text-[#6E685F]">
                  <span>Delivery:</span>
                  <span className="text-[#9A704B] font-medium">Instant PDF Download</span>
                </div>
              </div>

              {downloadItems.length > 1 ? (
                <div className="w-full space-y-2">
                  <span className="text-xs font-bold text-[#24231F] block text-left">Your Download Files:</span>
                  {downloadItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.downloadUrl}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#FAF8F5] hover:bg-white border border-[#E8E4DC] text-[#24231F] font-medium text-xs flex items-center justify-between transition-colors shadow-sm"
                    >
                      <span className="truncate mr-2">{item.title}</span>
                      <DownloadCloud className="w-4 h-4 text-[#9A704B] shrink-0" />
                    </a>
                  ))}
                </div>
              ) : downloadUrl ? (
                <a
                  href={downloadUrl}
                  download={book ? book.fileName : 'ebook.pdf'}
                  className="w-full py-3 px-4 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download Ebook ({format})</span>
                </a>
              ) : null}

              <p className="text-[11px] text-[#81796D] flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9A704B]" />
                <span>100% DRM-Free Universal PDF. Enjoy reading!</span>
              </p>
            </div>
          ) : status === 'expired' ? (
            /* Expired State */
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-full text-amber-700">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#24231F]">Session Expired</h3>
              <p className="text-xs text-[#6E685F] max-w-xs">
                The 10-minute UPI reservation expired. Please restart checkout.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={initPaymentSession}
                  className="px-4 py-2 bg-[#24231F] hover:bg-[#3D3B35] text-xs font-semibold text-white rounded-lg flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start New Session</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E8E4DC] bg-white text-xs font-medium text-[#24231F] rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Active UPI Checkout State */
            <div className="space-y-4">
              {/* Product and Price Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DC]">
                <div className="max-w-[240px]">
                  <h4 className="font-serif text-sm font-bold text-[#24231F] truncate">{title}</h4>
                  <p className="text-xs text-[#81796D]">{format} • {fileSize}</p>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl font-bold text-[#24231F]">
                    ₹{order?.amount}
                  </div>
                  <span className="text-[10px] text-[#81796D]">0% Surcharge Direct UPI</span>
                </div>
              </div>

              {/* Dynamic QR Code Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl relative">
                {order?.qrUrl ? (
                  <img
                    src={order.qrUrl}
                    alt={`Scan UPI QR to pay ₹${order.amount}`}
                    className="w-44 h-44 object-contain rounded-md border border-[#E8E4DC] bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-white rounded-md text-[#81796D] text-xs border border-[#E8E4DC]">
                    QR Unavailable
                  </div>
                )}
                <div className="mt-2 text-xs font-sans font-medium text-[#24231F]">
                  Amount to Pay: <strong>₹{order?.amount}</strong>
                </div>
                <span className="text-[11px] text-[#81796D] mt-0.5">
                  Scan with GPay, PhonePe, Paytm, FamPay, or BHIM
                </span>
              </div>

              {/* Mobile UPI App Intent Button */}
              {order?.upiIntent && (
                <a
                  href={order.upiIntent}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#24231F] hover:bg-[#3D3B35] text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in UPI App (₹{order.amount})</span>
                </a>
              )}

              {/* UPI ID copy fallback */}
              {order?.upiId && (
                <div className="flex items-center justify-between bg-[#FAF8F5] px-3.5 py-2.5 rounded-lg border border-[#E8E4DC] text-xs">
                  <div className="truncate mr-2">
                    <span className="text-[#81796D] text-[10px] block">Direct UPI VPA:</span>
                    <span className="font-mono text-[#24231F] text-xs">
                      {order.upiId.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '***' + c)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded bg-white hover:bg-[#FAF8F5] border border-[#E8E4DC] text-[#24231F] text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-[#9A704B]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy VPA'}</span>
                  </button>
                </div>
              )}

              {/* Countdown & Polling Indicator */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center space-x-1.5 text-[#6E685F]">
                  <Clock className="w-3.5 h-3.5 text-[#9A704B]" />
                  <span>Expires in:</span>
                  <span className="font-mono font-bold text-[#24231F]">{formatTimer(timeLeft)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[#9A704B]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] font-medium">Awaiting transfer...</span>
                </div>
              </div>

              {/* Manual Verification Trigger */}
              <button
                type="button"
                onClick={checkPayment}
                disabled={isManualChecking}
                className="w-full py-2.5 px-3 rounded-lg border border-[#E8E4DC] hover:border-[#D5CEBE] bg-white hover:bg-[#FAF8F5] text-[#24231F] text-xs font-medium flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isManualChecking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A704B]" />
                    <span>Confirming with Bank...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9A704B]" />
                    <span>I have paid — Verify My Order</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#E8E4DC] text-[11px] text-[#81796D] flex items-center justify-between">
          <span>Direct UPI & Card Settlement</span>
          <span>Zero Surcharge • 100% Secure</span>
        </div>
      </div>
    </div>
  );
}
