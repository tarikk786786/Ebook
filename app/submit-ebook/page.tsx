'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CommunityShell from '@/components/community/CommunityShell';
import CommunityMagicLinkCard from '@/components/community/CommunityMagicLinkCard';
import CommunityApiNotice from '@/components/community/CommunityApiNotice';
import { Upload, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { MAX_SUGGESTED_PRICE_RETAIL_FRACTION } from '@/lib/community/validation';

export default function SubmitEbookPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  const retailNum = parseFloat(retailPrice);
  const suggestedNum = parseFloat(suggestedPrice);
  const maxSuggested =
    Number.isFinite(retailNum) && retailNum > 0 ? retailNum * MAX_SUGGESTED_PRICE_RETAIL_FRACTION : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessId(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!Number.isFinite(retailNum) || retailNum <= 0 || !Number.isFinite(suggestedNum) || suggestedNum <= 0) {
      setError('Enter valid retail and suggested prices in INR.');
      return;
    }
    if (maxSuggested !== null && suggestedNum > maxSuggested + 0.01) {
      setError(`Suggested price must be ≤ ${MAX_SUGGESTED_PRICE_RETAIL_FRACTION * 100}% of retail (max ₹${maxSuggested.toFixed(2)}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/community/submissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          isbn13: isbn13.trim() || undefined,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          licenseType: licenseType.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          retailPriceInr: retailNum,
          suggestedPriceInr: suggestedNum,
          status: 'submitted',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError('Sign in as a contributor first (magic link on the right).');
        return;
      }
      if (res.status === 404 || res.status === 501) {
        setError('Submission API is not live yet—save your draft locally and retry after deployment.');
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Submission failed.');
        return;
      }
      setSuccessId(data.submissionId || data.submission_id || 'pending');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommunityShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E8E4DC] text-xs text-[#81796D] font-medium">
            <Upload className="w-3.5 h-3.5 text-[#9A704B]" />
            <span>Community Publishing</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#24231F]">
            Submit a verified ebook
          </h1>
          <p className="text-sm text-[#6E685F] leading-relaxed">
            Share openly licensed or rights-cleared study material. We validate licenses manually, cap list prices at 10%
            of retail, and route a share of each sale to you.
          </p>
          <Link
            href="/contributor-dashboard"
            className="inline-flex items-center gap-1 text-xs text-[#9A704B] font-semibold hover:underline"
          >
            View earnings dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CommunityApiNotice feature="Ebook submission" apiPath="POST /api/community/submissions" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white border border-[#E8E4DC] rounded-xl p-6 sm:p-8 shadow-book space-y-5 text-xs"
          >
            <div>
              <h2 className="font-serif text-xl font-bold text-[#24231F]">Submission details</h2>
              <p className="text-[#6E685F] mt-1">Draft file upload will attach once storage API lands.</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{error}</div>
            )}
            {successId && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">
                Submission received (ref <span className="font-mono">{successId}</span>). Track status in{' '}
                <Link href="/contributor-dashboard/submissions" className="text-[#9A704B] font-semibold underline">
                  your dashboard
                </Link>
                .
              </div>
            )}

            <Field label="Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Exact edition title"
                required
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Author">
                <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
              </Field>
              <Field label="ISBN-13">
                <input value={isbn13} onChange={(e) => setIsbn13(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Category">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                placeholder="e.g. Distributed Systems"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} min-h-[100px]`}
                placeholder="Why this book helps students; edition notes"
              />
            </Field>

            <Field label="License / rights basis">
              <input
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className={inputClass}
                placeholder="CC-BY, public domain, author consent, etc."
              />
            </Field>

            <Field label="Canonical source URL (optional)">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className={inputClass}
                placeholder="Publisher or rights holder page"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Verified retail price (INR)" required>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>
              <Field
                label="Suggested list price (INR)"
                hint={
                  maxSuggested
                    ? `Max ${MAX_SUGGESTED_PRICE_RETAIL_FRACTION * 100}% of retail → ₹${maxSuggested.toFixed(0)}`
                    : undefined
                }
                required
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={suggestedPrice}
                  onChange={(e) => setSuggestedPrice(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>
            </div>

            <p className="text-[10px] text-[#81796D] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9A704B] shrink-0 mt-0.5" />
              Files and license proofs stay in private storage. Admins verify rights before anything is listed.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#24231F] hover:bg-[#3D3B35] text-white text-xs font-semibold disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Submit for review</span>
            </button>
          </form>

          <aside className="space-y-4">
            <CommunityMagicLinkCard
              role="contributor"
              title="Contributor sign-in"
              description="Required before your submission is queued. Magic link only—no password."
            />
            <ReviewSteps />
          </aside>
        </div>
      </div>
    </CommunityShell>
  );
}

const inputClass =
  'w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-md px-3 py-2 text-[#24231F] focus:outline-none focus:border-[#9A704B]';

function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium text-[#24231F]">
        {label}
        {required ? <span className="text-[#9A704B]"> *</span> : null}
      </label>
      {hint ? <p className="text-[10px] text-[#81796D] mb-1">{hint}</p> : null}
      {children}
    </div>
  );
}

function ReviewSteps() {
  const steps = [
    'Sign in with your contributor email',
    'Submit metadata and pricing',
    'Admin reviews license evidence',
    'Approved titles earn per sale',
  ];
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-book space-y-3 text-xs text-[#6E685F]">
      <h3 className="font-serif text-sm font-semibold text-[#24231F]">Review pipeline</h3>
      <ol className="space-y-2 list-decimal list-inside">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
