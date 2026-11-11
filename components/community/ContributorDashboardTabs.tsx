'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Wallet, Banknote } from 'lucide-react';

const TABS = [
  { href: '/contributor-dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/contributor-dashboard/submissions', label: 'Submissions', icon: FileText, exact: false },
  { href: '/contributor-dashboard/earnings', label: 'Earnings', icon: Wallet, exact: false },
  { href: '/contributor-dashboard/payouts', label: 'Payouts', icon: Banknote, exact: false },
] as const;

export default function ContributorDashboardTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-[#E8E4DC] pb-4"
      aria-label="Contributor dashboard"
    >
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              active
                ? 'bg-[#24231F] text-white border-[#24231F]'
                : 'bg-white text-[#6E685F] border-[#E8E4DC] hover:border-[#9A704B]/40 hover:text-[#24231F]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
