import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { listEbookRequests, adminUpdateRequestStatus } from '@/lib/community/admin-service';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

const requestStatusSchema = z.enum(['open', 'in_progress', 'fulfilled', 'duplicate', 'closed']);

const postSchema = z.object({
  action: z.literal('update_status'),
  requestId: z.string().min(1),
  status: requestStatusSchema,
  duplicateOf: z.string().min(1).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const q = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || 40);
  const offset = Number(searchParams.get('offset') || 0);

  try {
    const payload = listEbookRequests({ status, q, limit, offset });
    return NextResponse.json({ success: true, ...payload });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to list requests';
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

  const { requestId, status, duplicateOf, adminNotes } = parsed.data;
  if (status === 'duplicate' && !duplicateOf) {
    return NextResponse.json(
      { success: false, error: 'duplicateOf is required when status is duplicate' },
      { status: 400 },
    );
  }

  try {
    const result = adminUpdateRequestStatus(requestId, status, { duplicateOf, adminNotes });
    if (!result.ok) {
      return NextResponse.json({ success: false, ...result }, { status: 400 });
    }
    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Action failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
