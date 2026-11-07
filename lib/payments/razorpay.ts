import crypto from 'crypto';
import { CreateOrderParams, PaymentOrderResponse, WebhookResult } from './types';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_default';

/**
 * Creates an authorized Razorpay Order via REST API (Edge/Serverless compatible)
 */
export async function createRazorpayOrder(
  orderNumber: string,
  amountInInr: number,
  notes: Record<string, string> = {}
): Promise<{ orderId: string; amountInPaise: number; keyId: string }> {
  const amountInPaise = Math.round(amountInInr * 100);

  // If live keys are present, execute actual Razorpay API request
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          orderNumber,
          ...notes,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Razorpay API Error: ${err.error?.description || res.statusText}`);
    }

    const data = await res.json();
    return {
      orderId: data.id,
      amountInPaise: data.amount,
      keyId: RAZORPAY_KEY_ID,
    };
  }

  // Graceful development mode fallback order ID
  const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  return {
    orderId: mockOrderId,
    amountInPaise,
    keyId: RAZORPAY_KEY_ID,
  };
}

/**
 * Verifies standard client-side Razorpay payment signature
 * (razorpay_order_id + "|" + razorpay_payment_id) signed with secret
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    // In mock/test environments
    return Boolean(orderId && paymentId && signature);
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Verifies Razorpay Webhook Payload & Signature (X-Razorpay-Signature)
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signatureHeader: string
): WebhookResult {
  try {
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(signatureHeader, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isMatch) {
        return {
          verified: false,
          orderNumber: '',
          gatewayOrderId: '',
          amountInInr: 0,
          status: 'FAILED',
          error: 'Invalid Razorpay webhook signature',
        };
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (event === 'order.paid' || event === 'payment.captured') {
      const orderNumber = orderEntity?.receipt || paymentEntity?.notes?.orderNumber || '';
      const gatewayOrderId = orderEntity?.id || paymentEntity?.order_id || '';
      const gatewayPaymentId = paymentEntity?.id || '';
      const amountInInr = (paymentEntity?.amount || orderEntity?.amount_paid || 0) / 100;

      return {
        verified: true,
        orderNumber,
        gatewayOrderId,
        gatewayPaymentId,
        amountInInr,
        status: 'PAID',
        bankUtr: paymentEntity?.acquirer_data?.rrn || paymentEntity?.acquirer_data?.bank_transaction_id,
      };
    }

    return {
      verified: true,
      orderNumber: '',
      gatewayOrderId: '',
      amountInInr: 0,
      status: 'PENDING',
    };
  } catch (err: any) {
    return {
      verified: false,
      orderNumber: '',
      gatewayOrderId: '',
      amountInInr: 0,
      status: 'FAILED',
      error: err.message || 'Error processing Razorpay webhook',
    };
  }
}
