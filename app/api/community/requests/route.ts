import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ebookRequestCreateSchema,
  createEbookRequest,
  findDuplicateRequest,
  listPublicEbookRequests,
} from '@/lib/community';
import { verifyRequesterSession, signRequesterSessionPayload, REQUESTER_SESSION_COOKIE, buildCommunitySessionCookieOptions } from '@/lib/community/auth';
import {
  communityRateLimit,
  handleCommunityRouteError,
  jsonValidationError,
  parseJsonBody,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

const listQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'fulfilled', 'duplicate', 'closed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'requests-list', 60, 60_000);
    if (!limited.allowed) return limited.response!;

    const query = listQuerySchema.safeParse({
      status: req.nextUrl.searchParams.get('status') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    });

    const filters = query.success ? query.data : {};

    const requests = withCommunityDatabase((db) => listPublicEbookRequests(db, filters));
    return NextResponse.json({ requests });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'requests-create', 10, 60 * 60_000);
    if (!limited.allowed) return limited.response!;

    const body = await parseJsonBody(req);
    if (body instanceof NextResponse) return body;

    const parsed = ebookRequestCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error.issues);
    }

    const emailLimited = communityRateLimit(req, `request-email:${parsed.data.email}`, 5, 60 * 60_000);
    if (!emailLimited.allowed) return emailLimited.response!;

    return withCommunityDatabase((db) => {
      const duplicate = findDuplicateRequest(db, parsed.data.title, parsed.data.author);
      if (duplicate) {
        return NextResponse.json(
          {
            error: 'A matching request already exists. Upvote it instead of creating a duplicate.',
            duplicateOf: duplicate.requestId,
            existing: duplicate,
          },
          { status: 409 },
        );
      }

      const requestRow = createEbookRequest(db, parsed.data);

      const session = verifyRequesterSession(req);
      const res = NextResponse.json({ request: requestRow }, { status: 201 });

      if (!session || session.email !== parsed.data.email) {
        const token = signRequesterSessionPayload(parsed.data.email);
        res.cookies.set(REQUESTER_SESSION_COOKIE, token, buildCommunitySessionCookieOptions());
      }

      return res;
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
