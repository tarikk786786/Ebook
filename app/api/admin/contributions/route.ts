import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminAccess } from '@/lib/auth/admin';
import {
  listContributions,
  adminApproveContribution,
  adminRejectContribution,
  adminPublishContribution,
  adminSetContributionReview,
  adminUpdateLicenseVerification,
} from '@/lib/community/admin-service';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

const licenseStatusSchema = z.enum(['pending', 'verified', 'rejected', 'needs_review']);

const postSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    submissionId: z.string().min(1),
    adminNotes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('reject'),
    submissionId: z.string().min(1),
    adminNotes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('under_review'),
    submissionId: z.string().min(1),
    adminNotes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('publish'),
    submissionId: z.string().min(1),
    catalogRef: z.string().max(200).optional(),
  }),
  z.object({
    action: z.literal('update_license'),
    submissionId: z.string().min(1),
    status: licenseStatusSchema,
    commercialOk: z.boolean().optional(),
    platform: z.string().max(200).optional(),
    evidenceUrl: z.string().max(2000).optional(),
    reviewerNotes: z.string().max(2000).optional(),
  }),
]);

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const licenseStatus = searchParams.get('licenseStatus') || undefined;
  const q = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || 40);
  const offset = Number(searchParams.get('offset') || 0);

  try {
    const payload = listContributions({ status, licenseStatus, q, limit, offset });
    return NextResponse.json({ success: true, ...payload });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to list contributions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    if (input.action === 'approve') {
      const result = adminApproveContribution(input.submissionId, input.adminNotes);
      if (!result.ok) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    if (input.action === 'reject') {
      const result = adminRejectContribution(input.submissionId, input.adminNotes);
      if (!result.ok) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    if (input.action === 'under_review') {
      const result = adminSetContributionReview(input.submissionId, input.adminNotes);
      if (!result.ok) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    if (input.action === 'publish') {
      const result = adminPublishContribution(input.submissionId, input.catalogRef);
      if (!result.ok) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    if (input.action === 'update_license') {
      const result = adminUpdateLicenseVerification(input.submissionId, {
        status: input.status,
        commercialOk: input.commercialOk,
        platform: input.platform,
        evidenceUrl: input.evidenceUrl || undefined,
        reviewerNotes: input.reviewerNotes,
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, ...result }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
