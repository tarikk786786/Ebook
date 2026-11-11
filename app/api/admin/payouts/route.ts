import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminAccess } from '@/lib/auth/admin';
import {
  adminMarkPayoutPaidManual,
  adminUpdatePayoutRequestStatus,
  listAdminPayoutQueue,
} from '@/lib/community/payouts';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

const postSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    payoutRequestId: z.string().min(1),
    adminNotes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('reject'),
    payoutRequestId: z.string().min(1),
    adminNotes: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal('mark_paid'),
    payoutRequestId: z.string().min(1),
    adminRef: z.string().min(4).max(200),
  }),
]);

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const limit = Number(searchParams.get('limit') || 40);
  const offset = Number(searchParams.get('offset') || 0);

  try {
    const payload = listAdminPayoutQueue({ status, limit, offset });
    return NextResponse.json({ success: true, ...payload });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to list payout queue';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed JSON body' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }

  const actorId = 'admin';

  try {
    if (parsed.data.action === 'mark_paid') {
      const result = adminMarkPayoutPaidManual(parsed.data.payoutRequestId, parsed.data.adminRef, {
        actorId,
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, result });
    }

    const result = adminUpdatePayoutRequestStatus(
      parsed.data.payoutRequestId,
      parsed.data.action,
      { adminNotes: parsed.data.adminNotes, actorId },
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Payout action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
