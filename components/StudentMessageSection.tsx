'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function StudentMessageSection() {
  return (
    <section className="py-14 border-t border-slate-800 bg-[#090D14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-xl bg-[#111622] border border-slate-800 space-y-5">
          <div>
            <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
              Dedication
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              For every student who wants to learn more.
            </h2>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              You should not have to spend your entire day searching for one useful book. You should not have to struggle with confusing websites, disorganized catalogues, or unreliable information.
            </p>
            <p>
              Whether you are a student, independent learner, or researcher, we built this index to help you spend less time searching and more time studying. A nominal contribution covers server bandwidth and helps keep this platform dependable.
            </p>
            <p>
              Whenever a resource is legally available for free from its original source or repository, we want to help you discover that option too.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-300 font-medium">
              Knowledge becomes more powerful when it reaches more people.
            </span>
            <Link 
              href="/#catalog-shelf"
              className="px-4 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs shrink-0 transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore the Library</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
