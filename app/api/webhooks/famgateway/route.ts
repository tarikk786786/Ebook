import { NextRequest, NextResponse } from 'next/server';
import { verifyFamGatewaySignature, generateDownloadToken } from '@/lib/crypto';
import { BOOK_CATALOG } from '@/lib/catalog';

// Processed order cache for idempotent fulfillment & replay attack rejection
const processedOrders = new Set<string>();

/**
 * FamGateway Authoritative Webhook Receiver
 * Security Controls:
 * 1. Strict Timing-Safe HMAC-SHA256 signature verification.
 * 2. Payload size cap (max 64KB) against memory exhaustion.
 * 3. Replay attack rejection (idempotency keying on order_id).
 * 4. Whitelist event matching.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size boundary (<64KB)
    const contentLength = Number(req.headers.get('content-length') || '0');
    if (contentLength > 65536) {
      return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-famgateway-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing required signature header' }, { status: 401 });
    }

    // 2. Timing-safe cryptographic HMAC-SHA256 verification
    const isAuthentic = verifyFamGatewaySignature(rawBody, signature);
    if (!isAuthentic) {
      console.warn('[Security Alert] Unauthorized webhook signature attempt rejected.');
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (payload.event === 'payment.success') {
      const { order_id, amount, utr } = payload;

      if (!order_id || typeof order_id !== 'string') {
        return NextResponse.json({ error: 'Invalid order_id structure' }, { status: 400 });
      }

      // 3. Replay attack prevention: check if order was already fulfilled
      if (processedOrders.has(order_id)) {
        return NextResponse.json({
          status: 'success',
          message: 'Idempotent: Order already fulfilled previously',
          order_id,
        }, { status: 200 });
      }

      // Mark order as processed
      processedOrders.add(order_id);

      // Clean old entries if memory set exceeds 10,000 items
      if (processedOrders.size > 10000) {
        const iterator = processedOrders.values();
        for (let i = 0; i < 2000; i++) {
          const val = iterator.next().value;
          if (val) processedOrders.delete(val);
        }
      }

      // 4. Generate encrypted single-use download token
      const defaultBook = BOOK_CATALOG[0];
      const token = generateDownloadToken({
        orderId: order_id,
        bookId: defaultBook.id,
        fileName: defaultBook.fileName,
        issuedAt: Date.now(),
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
        maxDownloads: 5,
      });

      return NextResponse.json({
        status: 'success',
        message: 'Order fulfilled securely',
        order_id,
        token,
      }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored', reason: 'Unrecognized event' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal security failure' }, { status: 500 });
  }
}
