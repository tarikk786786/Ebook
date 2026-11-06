import { NextRequest, NextResponse } from 'next/server';
import { decryptDownloadToken } from '@/lib/crypto';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) {
      return new NextResponse('Missing access token', { status: 400 });
    }

    // Cryptographic validation (AES-256-GCM + Expiry check)
    const payload = decryptDownloadToken(token);

    if (!payload) {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; background: #0b0f17; color: #f8fafc; padding: 40px; text-align: center;">
            <h1 style="color: #ef4444;">Access Link Expired or Invalid</h1>
            <p style="color: #94a3b8;">This secure download token has expired (24h TTL) or was tampered with.</p>
            <p><a href="/" style="color: #10b981; text-decoration: underline;">Return to AnonTrove Catalog</a></p>
          </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Resolve file from private server storage
    const safeFileName = path.basename(payload.fileName || 'the-zero-trace-engineer.pdf');
    const filePath = path.join(process.cwd(), 'private_storage', safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Requested asset is temporarily unavailable on storage node.', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Stream file with strict privacy & security headers
    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        // Strict anti-forensics & anti-tracking headers
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (err: any) {
    console.error('Download stream error:', err);
    return new NextResponse('Internal streaming error', { status: 500 });
  }
}
