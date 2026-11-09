import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black text-emerald-400 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-slate-400 max-w-md mb-8">
        The book, category, or page you are looking for does not exist in our catalog or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20"
      >
        Return to Catalog Home
      </Link>
    </div>
  );
}
