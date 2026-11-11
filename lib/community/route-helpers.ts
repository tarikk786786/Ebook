import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ZodIssue } from 'zod';
import type { DatabaseSync } from 'node:sqlite';
import { checkRateLimit } from '@/lib/rate-limit';
import { openCommunityDatabase } from './db';
import { runCommunityMigrations } from './migrate';
import { CommunityAuthNotConfiguredError } from './auth';

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function communityRateLimit(
  req: NextRequest,
  bucket: string,
  limit = 20,
  windowMs = 60_000,
): { allowed: boolean; response?: NextResponse } {
  const ip = getClientIp(req);
  const check = checkRateLimit(`community:${bucket}:${ip}`, limit, windowMs);
  if (!check.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((check.resetAt - Date.now()) / 1000)) } },
      ),
    };
  }
  return { allowed: true };
}

export function withCommunityDatabase<T>(fn: (db: DatabaseSync) => T): T {
  const db = openCommunityDatabase();
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    runCommunityMigrations(db);
    return fn(db);
  } finally {
    db.close();
  }
}

export function jsonValidationError(issues: ZodIssue[]) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      issues: issues.map((i) => ({
        path: i.path.map(String).join('.'),
        message: i.message,
      })),
    },
    { status: 400 },
  );
}

export function handleCommunityRouteError(err: unknown): NextResponse {
  if (err instanceof CommunityAuthNotConfiguredError) {
    return NextResponse.json({ error: 'Community auth is not configured on this server.' }, { status: 503 });
  }
  console.error('[community/api]', err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function parseJsonBody(req: NextRequest): Promise<unknown | NextResponse> {
  try {
    return await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }
}

export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return 'http://localhost:3000';
}
