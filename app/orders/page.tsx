'use client';

import React from 'react';
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
  Clock 
} from 'lucide-react';

interface OrderRecord {
  orderNumber: string;
  date: string;
  amountInInr: number;
  gateway: 'FAMPAY' | 'FAMGATEWAY';
  status: 'PAID' | 'PENDING';
  bankUtr: string;
  items: Array<{ title: string; price: number; format: string }>;
}

export default function CustomerOrdersPage() {
  const orders: OrderRecord[] = [
    {
      orderNumber: 'ORD-982143',
      date: 'Today, 22:45',
      amountInInr: 98,
      gateway: 'FAMPAY',
      status: 'PAID',
      bankUtr: '431892019482',
      items: [
        { title: 'Basics of Equity Research', price: 49, format: 'PDF' },
        { title: '101 Linux Commands Handbook', price: 49, format: 'PDF' },
      ],
    },
    {
      orderNumber: 'ORD-761209',
      date: 'Nov 04, 2026',
      amountInInr: 29,
      gateway: 'FAMPAY',
      status: 'PAID',
      bankUtr: '519283746192',
      items: [
        { title: '10 Trading Strategies by Aseem Singhal', price: 29, format: 'EPUB' },
      ],
    },
    {
      orderNumber: 'ORD-549102',
      date: 'Oct 28, 2026',
      amountInInr: 399,
      gateway: 'FAMPAY',
      status: 'PAID',
      bankUtr: '891029384756',
      items: [
        { title: 'The Complete 6-Volume Digital Engineering Boxset', price: 399, format: 'PDF & EPUB' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb & Header */}
        <div className="pb-6 border-b border-slate-800">
          <Link
            href="/library"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Reading Vault</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Order History & Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {orders.length} Verified Orders
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-verified transactions, GST exemption under Section 22 CGST Act, and non-custodial receipts.
          </p>
        </div>

        {/* Orders List */}
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
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
                        {order.status}
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
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200">{it.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {it.format}
                        </span>
                      </div>
                      <span className="font-mono text-slate-300 font-bold">₹{it.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between text-xs">
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
      </main>
    </div>
  );
}
