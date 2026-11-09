'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeft, 
  Receipt, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Download, 
  CreditCard, 
  Clock,
  Search,
  BookOpen,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface OrderItem {
  bookId?: string;
  title: string;
  price: number;
  format: string;
  token?: string;
  downloadUrl?: string;
}

interface OrderRecord {
  orderId: string;
  orderNumber: string;
  date: string;
  amountInInr: number;
  gateway: string;
  status: 'PAID' | 'PENDING' | 'SUCCESS';
  bankUtr: string;
  items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Order Lookup state
  const [lookupId, setLookupId] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('anontrove_customer_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse customer orders from storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupSuccess(null);

    if (!lookupId.trim() || !lookupContact.trim()) {
      setLookupError('Please provide both your Order ID/Number and your billing email or mobile number.');
      return;
    }

    setLookupLoading(true);

    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIdentifier: lookupId.trim(),
          verificationContact: lookupContact.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLookupError(data.error || 'Verification failed. Please check your order details.');
        return;
      }

      const fetchedOrder: OrderRecord = data.order;
      
      // Update local state and save to customer storage
      setOrders(prev => {
        const exists = prev.some(o => o.orderId === fetchedOrder.orderId || o.orderNumber === fetchedOrder.orderNumber);
        const next = exists ? prev.map(o => (o.orderId === fetchedOrder.orderId ? fetchedOrder : o)) : [fetchedOrder, ...prev];
        try {
          localStorage.setItem('anontrove_customer_orders', JSON.stringify(next));
        } catch {}
        return next;
      });

      setLookupSuccess(`Order #${fetchedOrder.orderNumber} successfully verified and restored to your device!`);
      setLookupId('');
      setLookupContact('');
    } catch (err: any) {
      setLookupError('Network error connecting to verification server. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb & Header */}
        <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/library"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Reading Vault</span>
            </Link>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">Order History & Invoices</h1>
              {isLoaded && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                  {orders.length} {orders.length === 1 ? 'Verified Order' : 'Verified Orders'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographically verified UPI transactions, DRM-free educational literature, and digital tax receipts.
            </p>
          </div>

          <button
            onClick={() => setShowLookupModal(prev => !prev)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-xs font-medium text-slate-200 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showLookupModal ? 'Hide Order Lookup' : 'Find / Restore Past Order'}</span>
          </button>
        </div>

        {/* Restore / Lookup Form (Collapsible or always shown if empty) */}
        {(showLookupModal || (isLoaded && orders.length === 0)) && (
          <div className="mt-6 p-6 rounded-2xl bg-[#111724] border border-emerald-900/40 shadow-xl">
            <div className="max-w-xl">
              <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono">Verify & Restore Order</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Purchased on a different browser or device? Enter your Order ID (or Reference) and your billing email or mobile number to verify ownership and load your permanent reading pass.
              </p>

              <form onSubmit={handleLookupSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Order ID or Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-123456 or UUID"
                      value={lookupId}
                      onChange={(e) => setLookupId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Billing Email or Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. name@example.com or phone"
                      value={lookupContact}
                      onChange={(e) => setLookupContact(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {lookupError && (
                  <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{lookupError}</span>
                  </div>
                )}

                {lookupSuccess && (
                  <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{lookupSuccess}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    {lookupLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Ownership</span>
                      </>
                    )}
                  </button>
                  {orders.length > 0 && showLookupModal && (
                    <button
                      type="button"
                      onClick={() => setShowLookupModal(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State when no orders exist */}
        {isLoaded && orders.length === 0 && !showLookupModal && (
          <div className="mt-8 text-center py-16 bg-[#111724]/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Receipt className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">No Orders on this Browser</h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                When you complete an order on AnonTrove, your lifetime DRM-free licenses and verifiable invoices are permanently stored here.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/#catalog-shelf"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Explore Books Catalog
              </Link>
              <button
                onClick={() => setShowLookupModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-colors"
              >
                Look Up Existing Order
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {isLoaded && orders.length > 0 && (
          <div className="mt-8 space-y-6">
            {orders.map((order) => (
              <div
                key={order.orderId || order.orderNumber}
                className="bg-[#111724] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-sm">{order.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                          {order.status || 'PAID'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">{order.date}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-lg font-mono font-black text-emerald-400">
                      ₹{order.amountInInr}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      UTR: {order.bankUtr} • via {order.gateway}
                    </div>
                  </div>
                </div>

                {/* Items Purchased */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                    Purchased Items:
                  </span>
                  <div className="divide-y divide-slate-800/50">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-medium text-slate-200">{it.title}</span>
                          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                            {it.format || 'PDF'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-slate-300 font-bold">₹{it.price}</span>
                          {it.token && (
                            <Link
                              href={`/reader/${it.token}`}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-mono font-medium transition-colors"
                            >
                              Read
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Permanent DRM-Free License Granted</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <Link
                      href="/library"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 transition-colors"
                    >
                      Open in Library
                    </Link>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 transition-colors"
                    >
                      Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
