import { NextRequest, NextResponse } from 'next/server';
import { verifyRequesterSession } from '@/lib/community/auth';
import { buildVoterKey, upvoteEbookRequest } from '@/lib/community/requests';
import {
  communityRateLimit,
  getClientIp,
  handleCommunityRouteError,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

type RouteContext = { params: Promise<{ requestId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { requestId } = await context.params;
    const limited = communityRateLimit(req, 'request-upvote', 30, 60_000);
    if (!limited.allowed) return limited.response!;

    const requester = verifyRequesterSession(req);
    const voterKey = buildVoterKey(requester?.email ?? null, getClientIp(req));

    return withCommunityDatabase((db) => {
      const result = upvoteEbookRequest(db, requestId, voterKey);
      if (!result.ok) {
        return NextResponse.json({ error: 'Request not found or not open for upvotes.' }, { status: 404 });
      }

      return NextResponse.json({
        request: result.request,
        alreadyVoted: result.alreadyVoted,
      });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
