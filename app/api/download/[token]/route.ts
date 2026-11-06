import { NextRequest, NextResponse } from 'next/server';
import { decryptDownloadToken } from '@/lib/crypto';
import { BOOK_CATALOG } from '@/lib/catalog';
import fs from 'fs';
import path from 'path';

// In-memory token download counter (token -> count) to prevent unlimited scraping
const tokenDownloadCounts = new Map<string, number>();

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token || typeof token !== 'string' || token.length < 20) {
      return new NextResponse('Invalid request format', { status: 400 });
    }

    // Cryptographic validation (AES-256-GCM + Expiry check)
    const payload = decryptDownloadToken(token);

    if (!payload) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8"/>
            <title>Access Expired | AnonTrove</title>
            <meta name="robots" content="noindex, nofollow"/>
          </head>
          <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0f17; color: #f8fafc; padding: 60px 20px; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background: #121826; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
              <h2 style="color: #ef4444; margin-top: 0;">Access Token Expired or Invalid</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                This one-time encrypted stream token has either expired (24h TTL) or has failed cryptographic integrity validation.
              </p>
              <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #10b981; color: #0b0f17; font-weight: bold; border-radius: 8px; text-decoration: none; font-size: 13px;">
                Return to Storefront
              </a>
            </div>
          </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Enforce Max Download limits (default 5 downloads per valid token)
    const currentCount = tokenDownloadCounts.get(token) || 0;
    const maxAllowed = payload.maxDownloads || 5;

    if (currentCount >= maxAllowed) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8"/>
            <title>Download Limit Exceeded</title>
          </head>
          <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0f17; color: #f8fafc; padding: 60px 20px; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background: #121826; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
              <h2 style="color: #f59e0b; margin-top: 0;">Download Limit Reached</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                This single-use access token has reached its maximum permitted download quota (${maxAllowed} times).
              </p>
              <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #10b981; color: #0b0f17; font-weight: bold; border-radius: 8px; text-decoration: none; font-size: 13px;">
                Back to AnonTrove
              </a>
            </div>
          </body>
        </html>`,
        {
          status: 429,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Strict Whitelist Validation against BOOK_CATALOG
    const validBook = BOOK_CATALOG.find(
      (b) => b.id === payload.bookId && b.fileName === payload.fileName
    );

    if (!validBook) {
      return new NextResponse('Resource authorization mismatch.', { status: 403 });
    }

    // Path traversal defense & canonical boundary verification
    const privateStorageDir = path.resolve(process.cwd(), 'private_storage');
    const safeFileName = path.basename(validBook.fileName);
    const targetFilePath = path.resolve(privateStorageDir, safeFileName);

    if (!targetFilePath.startsWith(privateStorageDir)) {
      return new NextResponse('Access Denied', { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse('Asset storage temporarily unmounted', { status: 404 });
    }

    // Increment download count
    tokenDownloadCounts.set(token, currentCount + 1);

    const stat = fs.statSync(targetFilePath);
    const fileStream = fs.createReadStream(targetFilePath);

    // Stream file with strict anti-forensic & anti-cache headers
    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        // Strict anti-forensic and zero-cache directives
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Download-Options': 'noopen',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (err: any) {
    return new NextResponse('Secure streaming failure', { status: 500 });
  }
}
