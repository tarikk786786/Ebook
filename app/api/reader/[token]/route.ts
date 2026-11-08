import { NextRequest, NextResponse } from 'next/server';
import { decryptDownloadToken } from '@/lib/crypto';
import { getBookById } from '@/lib/catalog';
import { getStorageAdapter } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limit';
import fs from 'fs';
import path from 'path';

function inferMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.epub': return 'application/epub+zip';
    case '.mobi': return 'application/x-mobipocket-ebook';
    case '.azw3': return 'application/vnd.amazon.ebook';
    case '.cbz': return 'application/vnd.comicbook+zip';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token || typeof token !== 'string' || token.length < 20) {
      return new NextResponse('Invalid reader token format', { status: 400 });
    }

    // Edge Rate Limiting: 60 chunk/stream requests per minute per client IP
    const clientIp = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateCheck = checkRateLimit(`reader_stream_${clientIp}`, 60, 60000);
    if (!rateCheck.allowed) {
      return new NextResponse('Streaming rate limit exceeded. Please wait a moment.', {
        status: 429,
        headers: { 'Retry-After': '30' }
      });
    }

    // Cryptographic validation (AES-256-GCM + Expiry check)
    const payload = decryptDownloadToken(token);
    if (!payload) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8"/>
            <title>Access Expired | AnonTrove Reader</title>
            <meta name="robots" content="noindex, nofollow"/>
          </head>
          <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0f17; color: #f8fafc; padding: 60px 20px; text-align: center;">
            <div style="max-width: 440px; margin: 0 auto; background: #121826; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
              <h2 style="color: #ef4444; margin-top: 0;">Reading Session Expired</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                This reading session token has expired or failed cryptographic verification. Please open your book from the verified order screen.
              </p>
              <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #10b981; color: #0b0f17; font-weight: bold; border-radius: 8px; text-decoration: none; font-size: 13px;">
                Back to Storefront
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

    // Verify book existence in catalog
    const book = getBookById(payload.bookId);
    const safeFileName = path.basename(book?.fileName || payload.fileName);
    const mimeType = inferMimeType(safeFileName);

    // 1. Backblaze B2 Direct Streaming Pre-signed URL redirect
    const storage = getStorageAdapter();
    if (storage.provider === 'b2') {
      const storageKey = (book as any)?.storageKey || safeFileName;
      const signedUrl = await storage.getSignedUrl(storageKey, 3600, safeFileName);
      return NextResponse.redirect(signedUrl, {
        status: 307,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
        },
      });
    }

    // 2. Local Storage streaming fallback
    const privateStorageDir = path.resolve(process.cwd(), 'private_storage');
    const targetFilePath = path.resolve(privateStorageDir, safeFileName);

    if (targetFilePath.startsWith(privateStorageDir) && fs.existsSync(targetFilePath)) {
      const stat = fs.statSync(targetFilePath);
      const fileStream = fs.createReadStream(targetFilePath);

      return new NextResponse(fileStream as any, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': stat.size.toString(),
          'Content-Disposition': `inline; filename="${safeFileName}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        },
      });
    }

    return new NextResponse('Ebook content unavailable in storage vault', { status: 404 });
  } catch (err: any) {
    console.error('[Reader Route Error]', err);
    return new NextResponse('Reader content streaming error', { status: 500 });
  }
}
