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
      'TBBooks operates without storing customer identities in persistent databases. We do not require accounts, phone numbers, or passwords. Download links are generated as single-use signed tokens with a 24-hour expiration. Once expired, no forensic record remains on external tracking systems.',
  },
  {
    icon: Zap,
    question: 'Why do you use direct UPI settlement?',
    answer:
      'We use a 100% free, direct UPI payment architecture via FamPay. Unlike traditional custodial gateways that charge 2-3% + GST and take days to settle, funds settle peer-to-peer (P2P) directly to the merchant account instantly with 0% transaction fees. Every rupee paid goes directly to platform upkeep.',
  },
  {
    icon: Shield,
    question: 'How do cryptographic integrity and verification work?',
    answer:
      'When you complete a UPI payment, our backend verifies the transaction and issues a secure single-use access token. Each digital file listed is catalogued with format, file size, and SHA-256 integrity checksums so you can verify that the file downloaded matches the indexed copy bit-for-bit.',
  },
  {
    icon: RefreshCcw,
    question: 'What if I close the tab while paying?',
    answer:
      'Your order has a 10-minute dynamic UPI reservation. If you scanned the QR code or used UPI intent, our verification system recognizes the payment and allows you to retrieve your download link or order receipt using your order ID.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 border-t border-slate-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-medium text-slate-400 bg-[#111622] border border-slate-800 px-2.5 py-1 rounded-md">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3">
            Platform, Integrity & Service FAQ
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No telemetry, direct UPI settlement, and stateless ephemeral delivery.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="bg-[#0F141C] border border-slate-800 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-sm sm:text-base font-medium text-slate-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#111622] border border-slate-800 rounded-md text-slate-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800 bg-[#090D14]">
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
