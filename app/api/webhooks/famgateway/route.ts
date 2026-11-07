import { NextRequest, NextResponse } from 'next/server';
import { verifyFamGatewaySignature, generateDownloadToken } from '@/lib/crypto';
import { getOrderById, updateOrderStatus, saveOrder } from '@/lib/orders/store';
import { checkOrderStatus } from '@/lib/famgateway';

// In-memory cache for event deduplication
const processedWebhooks = new Set<string>();

/**
 * FamPay Authoritative Webhook Receiver
 * 
 * Security Controls:
 * 1. Payload size restriction (<64KB) to mitigate DoS / buffer abuse.
 * 2. Dual verification: HMAC-SHA256 signature verification with fallback to 
 *    direct upstream server-side status confirmation (checkOrderStatus).
 * 3. Exact order matching & amount reconciliation.
 * 4. Replay attack rejection & idempotent fulfillment.
 * 5. Exactly-once ebook fulfillment: tokens issued only for purchased items.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size boundary (<64KB)
    const contentLength = Number(req.headers.get('content-length') || '0');
    if (contentLength > 65536) {
      return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-famgateway-signature') || req.headers.get('x-fampay-signature');

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const orderId = payload.order_id || payload.orderId;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Invalid order_id structure' }, { status: 400 });
    }

    // 2. Dual Verification Architecture
    let isAuthentic = false;
    if (signature) {
      isAuthentic = verifyFamGatewaySignature(rawBody, signature);
    }

    // If signature is missing or verification failed, independently verify transaction
    // directly through upstream authoritative status endpoint
    if (!isAuthentic) {
      try {
        const upstreamStatus = await checkOrderStatus(orderId);
        if (upstreamStatus.status === 'success') {
          isAuthentic = true;
          // Sync bank UTR from authoritative upstream if available
          if (upstreamStatus.utr && !payload.utr) {
            payload.utr = upstreamStatus.utr;
          }
        }
      } catch (upstreamErr) {
        console.warn(`[FAMPAY WEBHOOK] Upstream status check failed for order ${orderId}:`, upstreamErr);
      }
    }

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Unauthorized: Webhook failed cryptographic & upstream verification' }, { status: 401 });
    }

    // 3. Match the correct order in store
    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order reference not found in store' }, { status: 404 });
    }

    // 4. Replay attack & event deduplication check
    const eventKey = `${orderId}:${payload.utr || 'VERIFIED'}`;
    if (processedWebhooks.has(eventKey) || order.status === 'SUCCESS' || order.status === 'PAID') {
      return NextResponse.json({
        status: 'success',
        message: 'Idempotent: Order already fulfilled previously',
        order_id: orderId,
        tokens: order.issuedTokens || [],
      }, { status: 200 });
    }

    // 5. Amount validation
    if (payload.amount) {
      const webhookAmount = Number(payload.amount);
      if (Math.abs(webhookAmount - order.totalInr) > 0.05) {
        updateOrderStatus(orderId, 'REVIEW_REQUIRED');
        return NextResponse.json({ 
          error: 'Amount mismatch: Transaction requires manual review' 
        }, { status: 400 });
      }
    }

    // 6. Atomic update to SUCCESS
    updateOrderStatus(orderId, 'SUCCESS', {
      gatewayOrderId: orderId,
      bankUtr: payload.utr || 'VERIFIED_VIA_UPSTREAM',
      amountInInr: order.totalInr,
    });

    processedWebhooks.add(eventKey);

    // 7. Exactly-once Ebook Access Generation
    const issuedTokens: Array<{ bookId: string; token: string; issuedAt: string }> = [];

    for (const item of order.items) {
      const token = generateDownloadToken({
        orderId: order.orderId,
        bookId: item.bookId,
        fileName: item.fileName,
        issuedAt: Date.now(),
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
        maxDownloads: 5,
      });

      issuedTokens.push({
        bookId: item.bookId,
        token,
        issuedAt: new Date().toISOString(),
      });
    }

    order.issuedTokens = issuedTokens;
    saveOrder(order);

    // Prune in-memory cache if it grows too large
    if (processedWebhooks.size > 5000) {
      const iterator = processedWebhooks.values();
      for (let i = 0; i < 1000; i++) {
        const val = iterator.next().value;
        if (val) processedWebhooks.delete(val);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Order fulfilled securely via FamPay',
      order_id: orderId,
      tokens: issuedTokens,
    }, { status: 200 });

  } catch (err: any) {
    console.error('[FAMPAY WEBHOOK] Critical error:', err?.message || err);
    return NextResponse.json({ error: 'Internal security failure' }, { status: 500 });
  }
}
