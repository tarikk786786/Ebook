import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CONTRIBUTOR_SESSION_COOKIE,
  REQUESTER_SESSION_COOKIE,
  buildCommunitySessionCookieOptions,
} from '@/lib/community/auth';
import { verifyMagicLinkToken } from '@/lib/community/magic-link';
import { handleCommunityRouteError, siteOrigin, withCommunityDatabase } from '@/lib/community/route-helpers';

const verifyQuerySchema = z.object({
  token: z.string().min(16).max(256),
  intent: z.enum(['contributor', 'requester']).default('contributor'),
  returnTo: z.string().max(512).optional(),
});

function safeRedirectPath(returnTo: string | undefined): string {
  if (!returnTo) return '/contributor-dashboard';
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return '/contributor-dashboard';
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = verifyQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or missing magic link token.' }, { status: 400 });
    }

    const verifyResult = withCommunityDatabase((db) =>
      verifyMagicLinkToken(db, parsed.data.token, parsed.data.intent),
    );

    if (!verifyResult.ok) {
      const status = verifyResult.reason === 'expired' ? 410 : 401;
      return NextResponse.json(
        { error: verifyResult.reason === 'expired' ? 'Magic link expired.' : 'Invalid magic link.' },
        { status },
      );
    }

    const redirectPath =
      parsed.data.intent === 'requester'
        ? safeRedirectPath(parsed.data.returnTo ?? '/request-ebook')
        : safeRedirectPath(parsed.data.returnTo ?? '/contributor-dashboard');

    const acceptJson = req.headers.get('accept')?.includes('application/json');
    const cookieName =
      parsed.data.intent === 'contributor' ? CONTRIBUTOR_SESSION_COOKIE : REQUESTER_SESSION_COOKIE;
    const cookieOpts = buildCommunitySessionCookieOptions();

    if (acceptJson) {
      const res = NextResponse.json({
        ok: true,
        email: verifyResult.email,
        intent: parsed.data.intent,
        redirectTo: redirectPath,
      });
      res.cookies.set(cookieName, verifyResult.sessionToken, cookieOpts);
      return res;
    }

    const destination = new URL(redirectPath, siteOrigin());
    const res = NextResponse.redirect(destination);
    res.cookies.set(cookieName, verifyResult.sessionToken, cookieOpts);
    return res;
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
