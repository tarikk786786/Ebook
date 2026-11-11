import { NextRequest, NextResponse } from 'next/server';
import { verifyContributorSession } from '@/lib/community/auth';
import { createContributorPayoutRequest, loadPayoutRulesSettings } from '@/lib/community/payouts';
import {
  communityPayoutRequestBodySchema,
  parsePayoutRulesSettings,
} from '@/lib/community/validation';
import {
  communityRateLimit,
  handleCommunityRouteError,
  jsonValidationError,
  parseJsonBody,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'payout-request', 8, 60_000);
    if (!limited.allowed) return limited.response!;

    const bodyRaw = await parseJsonBody(req);
    if (bodyRaw instanceof NextResponse) return bodyRaw;

    const parsed = communityPayoutRequestBodySchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return jsonValidationError(parsed.error.issues);
    }

    return withCommunityDatabase((db) => {
      const contributor = verifyContributorSession(req, db);
      if (!contributor) {
        return NextResponse.json({ error: 'Contributor session required.' }, { status: 401 });
      }

      const result = createContributorPayoutRequest(db, contributor, parsed.data.amountInr);
      if (!result.ok) {
        const status =
          result.code === 'insufficient_balance' || result.code === 'below_minimum' ? 400 : 409;
        return NextResponse.json(
          { error: result.error, code: result.code },
          { status },
        );
      }

      const rules = loadPayoutRulesSettings(db);
      return NextResponse.json({
        success: true,
        payoutRequestId: result.payoutRequestId,
        amountInr: result.amountInr,
        status: result.status,
        minWithdrawalInr: rules.minWithdrawalInr,
      });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'payout-rules', 30, 60_000);
    if (!limited.allowed) return limited.response!;

    return withCommunityDatabase((db) => {
      const rules = loadPayoutRulesSettings(db);
      parsePayoutRulesSettings(rules);
      return NextResponse.json({ minWithdrawalInr: rules.minWithdrawalInr });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
