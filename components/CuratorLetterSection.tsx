'use client';

import React from 'react';
import { Clock, Server, BookOpen, CheckCircle2 } from 'lucide-react';

export default function CuratorLetterSection() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 my-10">
      <div className="bg-[#111622] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        {/* Section Header */}
        <div className="border-b border-slate-800/80 pb-4">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Note from the Curator
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            You don&apos;t have to pay to find these books.
          </h2>
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            Most of the material indexed here can be found across public channels, archives, and discussion groups if you have the time to look. Here is why this index exists and what ₹29 covers.
          </p>
        </div>

        {/* Narrative */}
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            If you spend several hours digging through scattered channels, cloud folders, and forum threads, you can likely find many of these files for free. We do not claim authorship or copyright ownership over these publications.
          </p>
          <p>
            What you are paying is not the price of the book. It is a small service fee to cover the time spent finding, checking, and organizing files, plus the ongoing cost of fast hosting and index search so students and readers can access what they need in seconds.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Time Saved</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              We locate, clean, and verify complete files so you do not have to deal with broken mirrors or mislabeled downloads.
            </p>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Hosting Costs</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cloud storage nodes, search indexing, and ad-free direct downloads carry fixed server and bandwidth costs each month.
            </p>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Student Access</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expensive paywalls lock out self-taught learners. A ₹29 micro-contribution keeps this library accessible to anyone.
            </p>
          </div>
        </div>

        {/* Honest Checklist */}
        <div className="bg-[#0B0F17] border border-slate-800 rounded-lg p-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">If you have time to search on your own:</strong> You do not need to pay here. Every reader is free to search original sources.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">If you want instant access in one place:</strong> Your ₹29 keeps the servers online for other learners.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">If you can afford the official publication:</strong> Please support original authors and publishers directly.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Curator & Developer</span>
          <a
            href="#catalog-shelf"
            className="text-slate-300 hover:text-white font-medium underline underline-offset-4 transition-colors"
          >
            Browse Verified Catalog
          </a>
        </div>
      </div>
    </section>
  );
}
