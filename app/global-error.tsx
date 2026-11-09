'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-5xl font-black text-rose-500 mb-4">Critical Error</h1>
        <h2 className="text-2xl font-bold mb-2">Service Temporarily Unavailable</h2>
        <p className="text-slate-400 max-w-md mb-8">
          A critical system error occurred. Our engineering team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all shadow-lg"
        >
          Reload Application
        </button>
      </body>
    </html>
  );
}
