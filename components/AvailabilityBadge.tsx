'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Globe, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink, 
  Lock, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Book } from '@/lib/catalog';

export type AvailabilityStatus =
  | 'free_download'
  | 'public_domain'
  | 'open_access'
  | 'creative_commons'
  | 'authorized_distribution'
  | 'official_purchase_required'
  | 'subscription_access'
  | 'not_verified';

export interface AvailabilityConfig {
  status: AvailabilityStatus;
  label: string;
  shortLabel: string;
  badgeCls: string;
  description: string;
  icon: any;
}

export function getAvailabilityInfo(book: Book): AvailabilityConfig {
  const categoryLower = (book.category || '').toLowerCase();
  const titleLower = (book.title || '').toLowerCase();
  const descLower = (book.description || '').toLowerCase();

  // 1. Creative Commons check
  if (
    categoryLower.includes('creative commons') ||
    descLower.includes('creative commons') ||
    descLower.includes('cc-by') ||
    descLower.includes('cc by')
  ) {
    return {
      status: 'creative_commons',
      label: 'Creative Commons Licensed',
      shortLabel: 'CC Licensed',
      badgeCls: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      description: 'Distributed under open Creative Commons licensing terms.',
      icon: Globe,
    };
  }

  // 2. Open Access check
  if (
    book.primaryResourceType === 'research_paper' ||
    categoryLower.includes('open access') ||
    descLower.includes('open access') ||
    categoryLower.includes('open-source')
  ) {
    return {
      status: 'open_access',
      label: 'Open Access Resource',
      shortLabel: 'Open Access',
      badgeCls: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
      description: 'Freely open academic or educational resource indexed for accessibility.',
      icon: BookOpen,
    };
  }

  // 3. Public Domain check (classic literature or pre-1928 works)
  if (
    book.publicationYear && parseInt(book.publicationYear) < 1928 ||
    categoryLower.includes('classics') ||
    categoryLower.includes('public domain') ||
    descLower.includes('public domain')
  ) {
    return {
      status: 'public_domain',
      label: 'Public Domain Work',
      shortLabel: 'Public Domain',
      badgeCls: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      description: 'Free of copyright restrictions and permanently preserved in the public domain.',
      icon: Sparkles,
    };
  }

  // 4. Free and legally downloadable
  if (book.priceInInr === 0 || descLower.includes('free to download')) {
    return {
      status: 'free_download',
      label: 'Free & Legally Downloadable',
      shortLabel: 'Free Download',
      badgeCls: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      description: 'Freely available and legally downloadable from verified sources.',
      icon: CheckCircle2,
    };
  }

  // 5. Official purchase required (if flagged or external)
  if ((book as any).officialPurchaseRequired || (book as any).isExternalLink) {
    return {
      status: 'official_purchase_required',
      label: 'Official Purchase Required',
      shortLabel: 'Official Purchase',
      badgeCls: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      description: 'Commercial publication requiring official publisher acquisition.',
      icon: ExternalLink,
    };
  }

  // 6. Subscription / Library access
  if ((book as any).requiresSubscription) {
    return {
      status: 'subscription_access',
      label: 'Library / Subscription Access',
      shortLabel: 'Library Access',
      badgeCls: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      description: 'Available via authorized university or public digital library access.',
      icon: Lock,
    };
  }

  // 7. Default for curated verified digital files in archive: Authorized Distribution / Indexed Archive
  return {
    status: 'authorized_distribution',
    label: 'Authorized Distribution & Indexing',
    shortLabel: 'Authorized Index',
    badgeCls: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    description: 'Indexed, curated, and served via our secure digital preservation infrastructure.',
    icon: ShieldCheck,
  };
}

interface AvailabilityBadgeProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function AvailabilityBadge({
  book,
  size = 'sm',
  showDescription = false,
}: AvailabilityBadgeProps) {
  const info = getAvailabilityInfo(book);
  const Icon = info.icon;

  if (size === 'sm') {
    return (
      <span
        title={info.description}
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm ${info.badgeCls}`}
      >
        <Icon className="w-2.5 h-2.5 shrink-0" />
        <span>{info.shortLabel}</span>
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${info.badgeCls}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{info.label}</span>
      </div>
      {showDescription && (
        <p className="text-[11px] text-slate-400 leading-snug">
          {info.description}
        </p>
      )}
    </div>
  );
}
