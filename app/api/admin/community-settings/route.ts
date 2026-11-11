import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminAccess } from '@/lib/auth/admin';
import {
  getCommunityPlatformSettings,
  updateCommunityPlatformSettings,
} from '@/lib/community/admin-service';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 },
  );
}

const patchSchema = z
  .object({
    rewardSplit: z.record(z.string(), z.unknown()).optional(),
    pricingRules: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.rewardSplit !== undefined || d.pricingRules !== undefined, {
    message: 'Provide rewardSplit and/or pricingRules',
  });

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  try {
    const payload = getCommunityPlatformSettings();
    return NextResponse.json({ success: true, ...payload });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  try {
    const result = updateCommunityPlatformSettings(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ success: false, ...result }, { status: 400 });
    }
    const refreshed = getCommunityPlatformSettings();
    return NextResponse.json({ success: true, result, settings: refreshed.settings });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to update settings';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
