import { NextRequest, NextResponse } from 'next/server';
import { verifyFamGatewaySignature, generateDownloadToken } from '@/lib/crypto';
import { getBookById } from '@/lib/catalog';

/**
 * FamGateway Authoritative Webhook Receiver
 * Triggered automatically when FamGateway confirms a successful UPI payment.
 * Security: Timing-safe HMAC-SHA256 verification using X-FamGateway-Signature header.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-famgateway-signature');

    // Verify cryptographic signature against merchant API key
    const isAuthentic = verifyFamGatewaySignature(rawBody, signature);

    if (!isAuthentic) {
      console.warn('[FamGateway Webhook] Rejected unauthorized or tampered signature');
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === 'payment.success') {
      const { order_id, amount, utr, sender_name } = payload;
      console.log(`[FamGateway Webhook] Verified payment for Order: ${order_id}, Amount: ₹${amount}, UTR: ${utr}`);

      // Order fulfillment logic
      // In production, you can persist the verified order to Vercel KV / Postgres / Supabase
      // Here, we generate an authenticated ephemeral AES-256-GCM token
      const token = generateDownloadToken({
        orderId: order_id,
        bookId: 'book-zero-trace',
        fileName: 'the-zero-trace-engineer.pdf',
        issuedAt: Date.now(),
        ttlMs: 48 * 60 * 60 * 1000, // 48h
        maxDownloads: 5,
      });

      return NextResponse.json({
        status: 'success',
        message: 'Order fulfilled',
        order_id,
        token,
      }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored', reason: 'Unrecognized event' }, { status: 200 });
  } catch (err: any) {
    console.error('[FamGateway Webhook Error]', err);
    return NextResponse.json({ error: 'Internal processing failure' }, { status: 500 });
  }
}
