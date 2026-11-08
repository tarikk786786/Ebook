import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAffiliateByCode, registerAffiliate } from '@/lib/affiliate';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  upiId: z.string().min(3, 'Valid UPI ID required for payouts')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || 'Validation failed';
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }

    const affiliate = registerAffiliate(parsed.data.name, parsed.data.email, parsed.data.upiId);

    return NextResponse.json({
      success: true,
      message: 'Affiliate account activated successfully.',
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        referralLink: `https://ebook-sandy-chi.vercel.app/?ref=${affiliate.code}`,
        commissionRate: `${affiliate.commissionRatePercent}%`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Registration failed.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ success: false, error: 'Referral code required' }, { status: 400 });
  }

  const affiliate = getAffiliateByCode(code);
  if (!affiliate) {
    return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    affiliate: {
      code: affiliate.code,
      name: affiliate.name,
      totalReferrals: affiliate.totalReferrals,
      totalEarningsInInr: affiliate.totalEarningsInInr,
      pendingPayoutInInr: affiliate.pendingPayoutInInr,
      commissionRatePercent: affiliate.commissionRatePercent
    }
  });
}
