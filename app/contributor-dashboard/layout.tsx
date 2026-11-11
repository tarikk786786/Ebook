import type { Metadata } from 'next';
import CommunityShell from '@/components/community/CommunityShell';
import ContributorDashboardTabs from '@/components/community/ContributorDashboardTabs';

export const metadata: Metadata = {
  title: 'Contributor Dashboard | AnonTrove Community',
  description: 'Track ebook submissions, earnings, and UPI payout requests.',
};

export default function ContributorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommunityShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-[#24231F]">Contributor dashboard</h1>
          <p className="text-sm text-[#6E685F]">
            Earnings accrue after paid orders on your approved listings. Payouts are manual UPI after admin review.
          </p>
        </div>
        <ContributorDashboardTabs />
        {children}
      </div>
    </CommunityShell>
  );
}
