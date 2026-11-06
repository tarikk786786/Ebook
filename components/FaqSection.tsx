'use client';

import React, { useState } from 'react';
import { ChevronDown, Shield, Zap, Lock, RefreshCcw } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon: any;
}

const FAQS: FaqItem[] = [
  {
    icon: Lock,
    question: 'How is this store zero-trace and tracker-free?',
    answer:
      'AnonTrove operates without databases storing customer identities. We do not require accounts, phone numbers, or passwords. Download links are sealed into AES-256-GCM tokens with 24-hour time-to-live. Once expired, no forensic record remains on any external tracking servers.',
  },
  {
    icon: Zap,
    question: 'Why do you use direct UPI settlement?',
    answer:
      'We use a 100% free, non-custodial automated UPI payment architecture. Unlike traditional custodial gateways that charge 2-3% + GST and require corporate Current Accounts, funds settle peer-to-peer (P2P) directly to the merchant account within 0 seconds with 0.0% transaction fees. It is fully compliant under Section 22 of the CGST Act (turnover exemption under ₹20 Lakhs/year).',
  },
  {
    icon: Shield,
    question: 'How do encrypted webhooks and API calls work?',
    answer:
      'When you complete a UPI payment, the automated payment rail signs the HTTP notification using a timing-safe HMAC-SHA256 signature (X-FamGateway-Signature). The Vercel Serverless edge function verifies the authenticity before generating an encrypted single-use file stream token. Intermediaries or proxy snoops cannot forge payment confirmations.',
  },
  {
    icon: RefreshCcw,
    question: 'What if I close the tab while paying?',
    answer:
      'Your order has a 10-minute dynamic UPI reservation. If you scanned the QR code or used UPI intent, our automated polling server or webhook immediately registers the settlement, allowing you to access your one-time download link seamlessly.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full">
            Transparent Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Privacy, Cryptography & UPI FAQ
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No telemetry, zero-fee direct UPI settlement, and stateless ephemeral delivery.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="bg-[#121826] border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-emerald-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-[#0B0F17]/30">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
