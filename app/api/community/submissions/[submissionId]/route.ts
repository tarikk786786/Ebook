import { NextRequest, NextResponse } from 'next/server';
import { verifyContributorSession } from '@/lib/community/auth';
import {
  submissionPatchSchema,
  getSubmissionForContributor,
  patchSubmission,
  serializeSubmissionPublic,
} from '@/lib/community';
import {
  communityRateLimit,
  handleCommunityRouteError,
  jsonValidationError,
  parseJsonBody,
  withCommunityDatabase,
} from '@/lib/community/route-helpers';

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { submissionId } = await context.params;
    const limited = communityRateLimit(req, 'submission-detail', 60, 60_000);
    if (!limited.allowed) return limited.response!;

    return withCommunityDatabase((db) => {
      const contributor = verifyContributorSession(req, db);
      if (!contributor) {
        return NextResponse.json({ error: 'Contributor session required.' }, { status: 401 });
      }

      const submission = getSubmissionForContributor(db, contributor.id, submissionId);
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
      }

      return NextResponse.json({ submission: serializeSubmissionPublic(submission) });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { submissionId } = await context.params;
    const limited = communityRateLimit(req, 'submission-patch', 40, 60 * 60_000);
    if (!limited.allowed) return limited.response!;

    const body = await parseJsonBody(req);
    if (body instanceof NextResponse) return body;

    const parsed = submissionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error.issues);
    }

    return withCommunityDatabase((db) => {
      const contributor = verifyContributorSession(req, db);
      if (!contributor) {
        return NextResponse.json({ error: 'Contributor session required.' }, { status: 401 });
      }

      const result = patchSubmission(db, contributor.id, submissionId, parsed.data);
      if (!result.ok) {
        if (result.code === 'not_found') {
          return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
        }
        return NextResponse.json(
          { error: 'Submission can no longer be edited in its current status.' },
          { status: 409 },
        );
      }

      return NextResponse.json({
        submission: serializeSubmissionPublic(result.submission),
        status: result.submission.status,
      });
    });
  } catch (err) {
    return handleCommunityRouteError(err);
  }
}
