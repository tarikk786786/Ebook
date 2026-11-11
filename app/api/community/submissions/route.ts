import { NextRequest, NextResponse } from 'next/server';
import { verifyContributorSession } from '@/lib/community/auth';
import {
  submissionCreateSchema,
  createSubmissionDraft,
  listSubmissionsForContributor,
  serializeSubmissionPublic,
} from '@/lib/community';
import {
  communityRateLimit,
  handleCommunityRouteError,
  jsonValidationError,
  parseJsonBody,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

function requireContributor(req: NextRequest, db: Parameters<typeof verifyContributorSession>[1]) {
  const contributor = verifyContributorSession(req, db);
  if (!contributor) {
    return { error: NextResponse.json({ error: 'Contributor session required.' }, { status: 401 }) };
  }
  return { contributor };
}

export async function GET(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'submissions-list', 60, 60_000);
    if (!limited.allowed) return limited.response!;

    return withCommunityDatabase((db) => {
      const auth = requireContributor(req, db);
      if ('error' in auth) return auth.error;

      const submissions = listSubmissionsForContributor(db, auth.contributor.id);
      return NextResponse.json({
        submissions: submissions.map(serializeSubmissionPublic),
      });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = communityRateLimit(req, 'submissions-create', 20, 60 * 60_000);
    if (!limited.allowed) return limited.response!;

    const body = await parseJsonBody(req);
    if (body instanceof NextResponse) return body;

    const parsed = submissionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error.issues);
    }

    return withCommunityDatabase((db) => {
      const auth = requireContributor(req, db);
      if ('error' in auth) return auth.error;

      const submission = createSubmissionDraft(db, auth.contributor.id, parsed.data);
      return NextResponse.json({ submission: serializeSubmissionPublic(submission) }, { status: 201 });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
