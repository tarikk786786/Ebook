'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  Clock, 
  Server, 
  GraduationCap, 
  CheckCircle2, 
  Compass, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function CuratorLetterSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 my-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111726] to-[#0B0F17] border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
        {/* Ambient Warm Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>An Honest Note from the Curator</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              100% Radical Transparency • No Corporate BS
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
              You Don&apos;t Have to Pay Me to Find These Books.
            </h2>
            <p className="text-sm sm:text-base text-amber-200/90 font-medium leading-relaxed">
              If you have the time and patience, you can find almost every book here freely scattered across Telegram channels, WhatsApp groups, forums, and cloud drives. Here is why this website exists and what ₹29 actually supports.
            </p>
          </div>

          {/* The Opening Truth */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3">
            <p>
              <strong className="text-white">Dear Reader, Student, and Curious Mind,</strong>
            </p>
            <p>
              Let&apos;s be completely honest with each other. If you spend 3 to 4 hours digging through obscure Telegram channels, private WhatsApp study groups, discussion forums, and cluttered file-hosting sites, <strong className="text-emerald-300">you can probably find many of these books for free</strong>.
            </p>
            <p>
              I am not here to deceive you, pretend I wrote these books, or claim that I own their copyright. I am not a big corporation, and I am definitely not a scammer or reseller trying to profit off knowledge.
            </p>
          </div>

          {/* 3 Core Pillars: Why Charge ₹29? */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>1. Saving Your Time</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Finding clean, virus-free, full editions online usually means clicking through dozens of spam popups, dead links, and mislabeled files. We did that exhausting legwork for you so you can learn in seconds.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>2. Keeping Servers Alive</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Hosting terabytes of digital literature, maintaining sub-second search indexing, and providing instant zero-ad downloads costs money every month. ₹29 barely covers server and storage bills.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-left">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>3. Leveling the Field</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Knowledge shouldn&apos;t be restricted to those who can afford ₹1,500 hardcover books. For a student struggling to learn coding, trading, or science, ₹29 gives them immediate access to life-changing material.
              </p>
            </div>
          </div>

          {/* Transparent Triple Pledge */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-amber-950/20 border border-emerald-500/20 space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Our Transparent Three-Way Pledge:
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">If you have the time to hunt across the web for free:</strong> Please do! We cheer you on, and you do not owe us a single rupee.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">If you want the convenience of instant, verified access in 5 seconds:</strong> Your small ₹29 service fee helps us keep this library running for thousands of fellow students.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">If you can comfortably afford the original edition:</strong> We always encourage you to support the original authors and publishers directly.
                </span>
              </li>
            </ul>
          </div>

          {/* Signature Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 gap-3">
            <div className="flex items-center space-x-2 font-mono text-slate-300">
              <span>— Written with respect by the Curator</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">Independent Learner & Developer</span>
            </div>
            <a
              href="#catalog-shelf"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center space-x-1 transition-colors"
            >
              <span>Explore Verified Books Below</span>
              <span>↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
