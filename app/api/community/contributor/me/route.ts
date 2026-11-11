import { NextRequest, NextResponse } from 'next/server';
import { verifyContributorSession } from '@/lib/community/auth';
import { buildContributorMePayload } from '@/lib/community/contributor-profile';
import {
  communityRateLimit,
  handleCommunityRouteError,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

export async function GET(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'contributor-me', 60, 60_000);
    if (!limited.allowed) return limited.response!;

    return withCommunityDatabase((db) => {
      const contributor = verifyContributorSession(req, db);
      if (!contributor) {
        return NextResponse.json({ error: 'Contributor session required.' }, { status: 401 });
      }

      const payload = buildContributorMePayload(contributor, db);
      return NextResponse.json(payload);
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
