import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { listAdminEarningsLedger } from '@/lib/community/payouts';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const contributorId = searchParams.get('contributorId') || undefined;
  const entryType = searchParams.get('entryType') || undefined;
  const limit = Number(searchParams.get('limit') || 50);
  const offset = Number(searchParams.get('offset') || 0);

  try {
    const payload = listAdminEarningsLedger({ contributorId, entryType, limit, offset });
    return NextResponse.json({ success: true, ...payload });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to list earnings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
