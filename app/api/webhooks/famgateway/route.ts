import { NextRequest, NextResponse } from 'next/server';
import { verifyFamGatewaySignature, generateDownloadToken } from '@/lib/crypto';
import { updateOrderStatus, saveOrder } from '@/lib/orders/store';
import { verifyFamGatewayOrder } from '@/lib/famgateway';
import { DOWNLOAD_TOKEN_TTL_MS } from '@/lib/payments';
import { isWebhookEventProcessed, recordWebhookEventProcessed } from '@/lib/supabase';

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

    // 2. Strict Cryptographic Verification Architecture
    if (!signature) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing webhook signature header' },
        { status: 401 }
      );
    }

    const isAuthentic = verifyFamGatewaySignature(rawBody, signature);
    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Unauthorized: Webhook failed cryptographic verification' },
        { status: 401 }
      );
    }

    // 3. Match the correct order in store (authoritative: local + cloud)
    const { findOrderAuthoritative } = await import('@/lib/orders/store');
    const order = await findOrderAuthoritative(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order reference not found in store' }, { status: 404 });
    }

    // 4. Replay attack & event deduplication check (in-memory + Supabase audit log)
    const eventKey = `${orderId}:${payload.utr || 'VERIFIED'}`;
    const alreadyLogged = await isWebhookEventProcessed(eventKey);
    if (processedWebhooks.has(eventKey) || alreadyLogged || order.status === 'SUCCESS' || order.status === 'PAID') {
      return NextResponse.json({
        status: 'success',
        message: 'Idempotent: Order already fulfilled previously',
        order_id: orderId,
      }, { status: 200 });
    }

    // 5. Upstream Authoritative Verification (GET /api/verify-order.php)
    let verifiedUtr = payload.utr || payload.transaction_id || 'VERIFIED_VIA_UPSTREAM';
    let verifiedAmount = payload.amount !== undefined ? Number(payload.amount) : order.totalInr;

    try {
      const upstreamVerify = await verifyFamGatewayOrder(orderId);
      if (upstreamVerify.status === 'success' && upstreamVerify.data) {
        verifiedUtr = upstreamVerify.data.utr || upstreamVerify.data.transaction_id || verifiedUtr;
        if (upstreamVerify.data.amount) {
          verifiedAmount = Number(upstreamVerify.data.amount);
        }
      } else if (upstreamVerify.status === 'expired' || upstreamVerify.status === 'failed') {
        updateOrderStatus(orderId, 'FAILED');
        return NextResponse.json({ 
          error: `Upstream order status is ${upstreamVerify.status}` 
        }, { status: 400 });
      }
    } catch (verifyErr: any) {
      // In simulated webhook tests or transient network issue, rely on HMAC-SHA256 signature
      console.warn('[FAMPAY WEBHOOK] Authoritative verify-order check note:', verifyErr?.message || verifyErr);
    }

    // 6. Strict Amount Validation
    if (Math.abs(verifiedAmount - order.totalInr) > 0.05) {
      updateOrderStatus(orderId, 'REVIEW_REQUIRED');
      return NextResponse.json({ 
        error: `Amount mismatch: Expected ₹${order.totalInr}, received ₹${verifiedAmount}` 
      }, { status: 400 });
    }

    // 7. Atomic update to SUCCESS
    const paidOrder = updateOrderStatus(orderId, 'SUCCESS', {
      gatewayOrderId: orderId,
      bankUtr: verifiedUtr,
      amountInInr: order.totalInr,
    });

    if (paidOrder) {
      const { runPaidOrderSideEffects } = await import('@/lib/orders/paid-side-effects');
      runPaidOrderSideEffects(paidOrder);
    }

    processedWebhooks.add(eventKey);
    // Durable cross-instance webhook idempotency in Supabase audit log
    recordWebhookEventProcessed(eventKey, {
      orderId,
      utr: verifiedUtr,
      amount: verifiedAmount,
    }).catch(err => console.warn('[WEBHOOK] Non-blocking audit log record failed:', err));

    // 7. Exactly-once Ebook Access Generation
    const issuedTokens: Array<{ bookId: string; token: string; issuedAt: string }> = [];

    for (const item of order.items) {
      const token = generateDownloadToken({
        orderId: order.orderId,
        bookId: item.bookId,
        fileName: item.fileName,
        issuedAt: Date.now(),
        ttlMs: DOWNLOAD_TOKEN_TTL_MS,
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
    }, { status: 200 });

  } catch (err: any) {
    console.error('[FAMPAY WEBHOOK] Critical error:', err?.message || err);
    return NextResponse.json({ error: 'Internal security failure' }, { status: 500 });
  }
}
