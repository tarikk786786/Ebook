import crypto from 'crypto';
import { CreateOrderParams, PaymentOrderResponse, WebhookResult } from './types';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX'; // 'PRODUCTION' | 'SANDBOX'

const BASE_URL = CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

/**
 * Creates a Cashfree PG Order session
 */
export async function createCashfreeOrder(
  orderNumber: string,
  amountInInr: number,
  customerEmail: string,
  customerPhone?: string
): Promise<{ orderId: string; paymentSessionId: string; orderExpiryTime: string }> {
  if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderNumber,
        order_amount: amountInInr,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerEmail.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45),
          customer_email: customerEmail,
          customer_phone: customerPhone || '9999999999',
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app'}/success?order_id=${orderNumber}`,
          notify_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app'}/api/webhooks/cashfree`,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Cashfree API Error: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderExpiryTime: data.order_expiry_time,
    };
  }

  // Development/Mock session
  const mockOrderId = `cf_${orderNumber}`;
  const mockSessionId = `session_${crypto.randomBytes(16).toString('hex')}`;
  return {
    orderId: mockOrderId,
    paymentSessionId: mockSessionId,
    orderExpiryTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  };
}

/**
 * Verifies Cashfree Webhook Signature
 */
export function verifyCashfreeWebhook(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string
): WebhookResult {
  try {
    if (CASHFREE_SECRET_KEY) {
      const dataToSign = timestampHeader + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(dataToSign)
        .digest('base64');

      if (signatureHeader !== expectedSignature) {
        return {
          verified: false,
          orderNumber: '',
          gatewayOrderId: '',
          amountInInr: 0,
          status: 'FAILED',
          error: 'Cashfree webhook signature mismatch',
        };
      }
    }

    const payload = JSON.parse(rawBody);
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      return {
        verified: true,
        orderNumber: orderData?.order_id || '',
        gatewayOrderId: orderData?.order_id || '',
        gatewayPaymentId: paymentData?.cf_payment_id?.toString() || '',
        amountInInr: paymentData?.payment_amount || 0,
        status: 'PAID',
        bankUtr: paymentData?.bank_reference,
      };
    }

    return {
      verified: true,
      orderNumber: orderData?.order_id || '',
      gatewayOrderId: orderData?.order_id || '',
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
      error: err.message || 'Error processing Cashfree webhook',
    };
  }
}
