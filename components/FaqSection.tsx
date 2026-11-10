'use client';

import React, { useState } from 'react';
import { ChevronDown, Shield, BookOpen, Lock, RefreshCcw, HelpCircle, Heart, Scale } from 'lucide-react';
import { getSupportEmail } from '@/lib/site';

interface FaqItem {
  question: string;
  answer: string;
  icon: any;
}

function buildFaqs(supportEmail: string): FaqItem[] {
  return [
  {
    icon: Heart,
    question: 'Why are books so cheap (₹9 to ₹29), and am I buying copyright ownership?',
    answer:
      'No. You are never paying for copyright ownership. The ₹9 to ₹29 is a nominal convenience and maintenance fee that covers high-speed encrypted cloud storage, virus scanning, table-of-contents extraction, and zero-ad instant delivery. We believe education should be accessible to students and independent learners. If you have time, you can locate many files in public web archives for free; our fee covers the curation and infrastructure to access them in seconds. If you can afford the official publisher edition, please support authors and publishers directly!',
  },
  {
    icon: Scale,
    question: 'What is your copyright, takedown, and DMCA transparency procedure?',
    answer:
      `We operate with 100% transparency. We do not claim ownership of third-party publications. All intellectual property remains with the original creators and publishers. If you are an author, copyright holder, or publisher and wish to have a title reviewed, updated, or removed, our designated agent responds within 24 hours at ${supportEmail} with zero resistance.`,
  },
  {
    icon: BookOpen,
    question: 'What format are the ebooks delivered in, and can I read them on Kindle/iPad?',
    answer:
      'All titles are delivered in universal DRM-free PDF formats. You can transfer them to your Kindle (via Send-to-Kindle or USB), open them in Apple Books on iPad/iPhone, or read them on any Android tablet, e-reader, or laptop without requiring proprietary software.',
  },
  {
    icon: Shield,
    question: 'What does "DRM-Free" mean for me as a reader?',
    answer:
      'DRM-free means no restrictive digital locks or device limits. When you purchase a book from AnonTrove, you own your personal copy forever. You can print study chapters, highlight, annotate, and back up your files to your personal drive.',
  },
  {
    icon: Lock,
    question: 'How do the in-browser reader and instant downloads work?',
    answer:
      'Immediately upon successful UPI checkout, you receive a cryptographically signed order link. You can download the full PDF to your device or click "Open Reader" to read immediately in your browser with responsive page flipping, dark/sepia paper modes, and zoom controls.',
  },
  {
    icon: RefreshCcw,
    question: 'How does UPI payment settlement work?',
    answer:
      'We support direct UPI payment rails (Google Pay, PhonePe, Paytm, FamPay, BHIM). Transactions are processed with bank-grade 256-bit encryption. There are zero hidden surcharges, no payment gateway markups, and no recurring subscriptions.',
  },
  {
    icon: HelpCircle,
    question: 'What is your refund and satisfaction policy?',
    answer:
      `We offer a 100% money-back satisfaction guarantee. If an ebook file fails to open, is corrupted, or does not match its catalog description, contact our support team at ${supportEmail} within 7 days for an immediate refund or replacement.`,
  },
  ];
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = buildFaqs(getSupportEmail());

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 border-t border-[#E8E4DC] font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-sans font-medium text-[#81796D] bg-white border border-[#E8E4DC] px-3 py-1 rounded-full">
            Reader Guidance &amp; Honest Answers
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24231F] tracking-tight mt-3">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#6E685F] mt-1">
            Pricing transparency, copyright ethics, delivery formats, and reader guarantees.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const Icon = faq.icon;
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden transition-all shadow-book"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-serif font-semibold text-[#24231F] hover:text-[#9A704B] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#FAF8F5] border border-[#E8E4DC] rounded-md text-[#9A704B] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#81796D] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-[#24231F]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#5B5449] leading-relaxed border-t border-[#E8E4DC]/80 bg-[#FAF8F5]/60 font-sans">
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
