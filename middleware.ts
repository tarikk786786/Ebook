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

  // Periodic inline eviction if map grows
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }

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

// Multi-Domain Whitelist for CORS
const ALLOWED_ORIGINS = new Set([
  'https://ebook-sandy-chi.vercel.app',
  'https://anontrove.vercel.app',
  'https://anontrove-books.vercel.app',
  'https://anontrove-store.vercel.app',
  'https://trovebooks.vercel.app',
  'https://read.devs.surf',
  'https://tbstore.devs.surf',
  'https://tbbooks.devs.surf',
  'https://ebook.devs.surf',
  'https://tarikk786786.github.io',
  'http://localhost:3000',
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin') || '';

  // Handle CORS Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    if (ALLOWED_ORIGINS.has(origin)) {
      preflightHeaders.set('Access-Control-Allow-Origin', origin);
      preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
      preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
      preflightHeaders.set('Access-Control-Max-Age', '86400');
    }
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

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

  // Attach CORS headers if request matches origin
  if (ALLOWED_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
