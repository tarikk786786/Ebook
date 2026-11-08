import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getBookBySlug } from '@/lib/catalog';
import Link from 'next/link';
import { BookOpen, ShieldAlert, ArrowLeft, ShoppingBag } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
  searchParams: {
    token?: string;
    order_id?: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getBookBySlug(params.slug);
  return {
    title: book ? `Read ${book.title} | AnonTrove Reader` : 'Ebook Reader | AnonTrove',
    robots: 'noindex, nofollow',
  };
}

export default function BookReadRedirectPage({ params, searchParams }: Props) {
  const book = getBookBySlug(params.slug);
  if (!book) {
    notFound();
  }

  // If token is provided in query params, seamlessly redirect to secure reader
  if (searchParams.token) {
    redirect(`/reader/${encodeURIComponent(searchParams.token)}`);
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121826] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
            Protected Online Reader
          </span>
          <h1 className="text-xl font-bold text-white mt-3">{book.title}</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            In-browser reading is cryptographically gated. Access requires a verified purchase token from your order confirmation screen.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href={`/book/${book.slug}`}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Book & Purchase Options</span>
          </Link>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
