'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Smartphone,
  QrCode,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { getBookById } from '@/lib/catalog';
import { describeSupportedUpiApps } from '@/lib/payments/upi-apps';

type CheckoutOrder = {
  orderId: string;
  orderNumber: string;
  amount: string;
  amountInInr: number;
  title?: string;
  qrUrl?: string;
  upiIntent?: string;
  upiId?: string;
  checkoutUrl?: string;
  processingUrl?: string;
  expiresAtIst?: string;
  payableAmount?: string;
  taxNote?: string;
  items?: Array<{ bookId: string; title: string; priceInInr: number; coverImage?: string }>;
};

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId') || searchParams.get('book_id') || '';
  const book = bookId ? getBookById(bookId) : null;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);

  const supportedApps = useMemo(() => describeSupportedUpiApps(), []);

  useEffect(() => {
    if (!bookId) setError('Missing ebook selection. Return to the catalogue and choose Buy Now.');
  }, [bookId]);

  const createOrder = async () => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          customerEmail: email.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          couponCode: coupon.trim() || undefined,
          gateway: 'FAMGATEWAY',
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success' || !json.data) {
        throw new Error(json.error || 'Failed to create FamGateway payment order');
      }
      setOrder(json.data as CheckoutOrder);
    } catch (e: any) {
      setError(e?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const goHostedCheckout = () => {
    if (!order?.checkoutUrl) return;
    window.location.href = order.checkoutUrl;
  };

  const openUpiIntent = () => {
    if (!order?.upiIntent) return;
    window.location.href = order.upiIntent;
    router.push(
      `/payment/processing?order_id=${encodeURIComponent(order.orderId)}&book_id=${encodeURIComponent(bookId)}`
    );
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link href={book ? `/book/${book.slug}` : '/'} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Choose Your Preferred Payment Method</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Complete your payment securely using your favourite UPI app via FamGateway. No WhatsApp payment links.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
            <div className="flex gap-4">
              {book?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverImage} alt="" className="w-24 h-32 object-cover rounded-lg border border-slate-700" />
              ) : (
                <div className="w-24 h-32 rounded-lg bg-slate-900 border border-slate-700" />
              )}
              <div>
                <div className="text-lg font-medium">{book?.title || 'Selected ebook'}</div>
                <div className="text-sm text-slate-400 mt-1">{book?.author}</div>
                <div className="mt-3 text-2xl font-semibold text-emerald-300">
                  ₹{book?.priceInInr?.toLocaleString('en-IN') ?? '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Price calculated server-side from catalogue
                </div>
              </div>
            </div>

            {!order && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs text-slate-400">
                  Email (for order receipt / library)
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Phone (optional)
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                    placeholder="10-digit mobile"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Coupon (optional)
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
                    placeholder="WELCOME10"
                  />
                </label>
                <button
                  onClick={createOrder}
                  disabled={loading || !bookId}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-3 text-sm font-medium text-slate-950"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Proceed to FamGateway Checkout
                </button>
              </div>
            )}

            {order && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    Order ID: <span className="text-slate-200 font-mono">{order.orderNumber || order.orderId}</span>
                  </div>
                  <div>
                    Amount: <span className="text-emerald-300 font-medium">₹{order.payableAmount || order.amount}</span>
                  </div>
                  {order.expiresAtIst ? <div>Expires (IST): {order.expiresAtIst}</div> : null}
                  {order.taxNote ? <div>{order.taxNote}</div> : null}
                </div>

                <button
                  onClick={goHostedCheckout}
                  disabled={!order.checkoutUrl || order.checkoutUrl.includes('/payment/')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-3 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Pay on FamGateway Hosted Checkout
                </button>

                <button
                  onClick={openUpiIntent}
                  disabled={!order.upiIntent}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-600 hover:border-emerald-500/60 px-4 py-3 text-sm"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Open UPI App (Intent)
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/payment/processing?order_id=${encodeURIComponent(order.orderId)}&book_id=${encodeURIComponent(bookId)}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs text-slate-300"
                >
                  I already paid — verify status
                </button>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Supported payer apps (via OS chooser / FamGateway checkout): {supportedApps.join(', ')}.
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="w-4 h-4 text-cyan-400" />
              Desktop QR fallback
            </div>
            {order?.qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.qrUrl} alt="UPI QR" className="w-56 h-56 mx-auto rounded-lg bg-white p-2" />
            ) : (
              <div className="h-56 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">
                QR appears after order creation
              </div>
            )}
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan with any UPI app. Payment unlocks only after FamGateway server verification — never from this page alone.
            </p>
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2 text-[11px] text-slate-400 flex gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              Secured by FamGateway HMAC webhooks + authenticated verify-order.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070B12] text-slate-300 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading checkout…
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
