import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { decryptDownloadToken } from '@/lib/crypto';
import { getBookById } from '@/lib/catalog';
import SecureEbookReader from '@/components/reader/SecureEbookReader';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

interface Props {
  params: {
    token: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payload = decryptDownloadToken(params.token);
  if (!payload) {
    return {
      title: 'Invalid or Expired Reader Session | AnonTrove',
      robots: 'noindex, nofollow',
    };
  }

  const book = getBookById(payload.bookId);
  return {
    title: `${book ? book.title : 'Protected Volume'} — Secure Reader | AnonTrove`,
    robots: 'noindex, nofollow, noarchive',
  };
}

export default function ReaderPage({ params }: Props) {
  const { token } = params;

  if (!token || typeof token !== 'string') {
    notFound();
  }

  const payload = decryptDownloadToken(token);

  if (!payload) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">Access Expired or Invalid</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This reader session token has either passed its validity window (24h TTL) or failed cryptographic verification.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center space-x-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const book = getBookById(payload.bookId);
  const bookTitle = book?.title || 'Purchased Digital Volume';
  const bookAuthor = book?.author || 'Independent Creator';
  const bookCategory = book?.category || 'Technical Guide';
  const format = book?.format || 'PDF';
  const expiresAt = payload.issuedAt + payload.ttlMs;

  return (
    <SecureEbookReader
      token={token}
      bookTitle={bookTitle}
      bookAuthor={bookAuthor}
      bookCategory={bookCategory}
      format={format}
      orderId={payload.orderId}
      expiresAt={expiresAt}
    />
  );
}
