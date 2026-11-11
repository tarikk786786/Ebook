import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getContributionDetail } from '@/lib/community/admin-service';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ submissionId: string }> },
) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { submissionId } = await context.params;
  if (!submissionId?.trim()) {
    return NextResponse.json({ success: false, error: 'submissionId required' }, { status: 400 });
  }

  try {
    const detail = getContributionDetail(submissionId.trim());
    if (!detail) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, submission: detail });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load submission';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
