import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sliding-window rate limiter for serverless edge instances
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count++;
  return true;
}

// Periodic cleanup to avoid memory leak in long-lived edge runtimes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((val, key) => {
    if (now > val.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Path Traversal & Injection Defense
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('\0')) {
    return new NextResponse('Bad Request: Malformed URI sequence', { status: 400 });
  }

  // 2. Client IP extraction (supports Vercel, Cloudflare, standard proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const clientIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

  // 3. Rate Limit /api/checkout (Max 10 requests / minute)
  if (pathname.startsWith('/api/checkout')) {
    const isAllowed = checkRateLimit(`checkout_${clientIp}`, 10, 60000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too Many Requests: Checkout rate limit exceeded. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // 4. Rate Limit /api/poll (Max 40 requests / minute)
  if (pathname.startsWith('/api/poll')) {
    const isAllowed = checkRateLimit(`poll_${clientIp}`, 40, 60000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too Many Requests: Polling limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      );
    }
  }

  // 5. Rate Limit /api/admin/* (Max 30 requests / minute)
  if (pathname.startsWith('/api/admin')) {
    const isAllowed = checkRateLimit(`admin_${clientIp}`, 30, 60000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too Many Requests: Administrative rate limit exceeded.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
