import { NextRequest, NextResponse } from 'next/server';
import { verifyContributorSession, verifyRequesterSession } from '@/lib/community/auth';
import { issueCommunityMagicLink, isCommunityEmailDeliveryConfigured } from '@/lib/community/magic-link';
import { communityMagicLinkRequestSchema } from '@/lib/community/validation';
import {
  communityRateLimit,
  handleCommunityRouteError,
  parseJsonBody,
  siteOrigin,
  jsonValidationError,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

export async function POST(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'magic-link', 8, 60_000);
    if (!limited.allowed) return limited.response!;

    const body = await parseJsonBody(req);
    if (body instanceof NextResponse) return body;

    const parsed = communityMagicLinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error.issues);
    }

    const emailLimited = communityRateLimit(req, `magic-email:${parsed.data.email}`, 5, 15 * 60_000);
    if (!emailLimited.allowed) return emailLimited.response!;

    const result = withCommunityDatabase((db) =>
      issueCommunityMagicLink(db, parsed.data, siteOrigin()),
    );

    if (!isCommunityEmailDeliveryConfigured()) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[community/auth] Magic link (SMTP not configured):', result.verifyUrl);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If that email is valid, a sign-in link has been sent.',
      expiresAt: result.expiresAt,
      ...(process.env.NODE_ENV !== 'production' && !isCommunityEmailDeliveryConfigured()
        ? { devMagicUrl: result.verifyUrl }
        : {}),
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}

/** Session probe for contributor or requester cookies. */
export async function GET(req: NextRequest) {
  try {
    return withCommunityDatabase((db) => {
      const contributor = verifyContributorSession(req, db);
      if (contributor) {
        return NextResponse.json({
          authenticated: true,
          role: 'contributor',
          email: contributor.email,
          contributorId: contributor.id,
          status: contributor.status,
        });
      }

      const requester = verifyRequesterSession(req);
      if (requester) {
        return NextResponse.json({
          authenticated: true,
          role: 'requester',
          email: requester.email,
        });
      }

      return NextResponse.json({ authenticated: false });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
