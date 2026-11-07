import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhook } from '@/lib/payments/cashfree';
import { dispatchMarketingEvent } from '@/lib/marketing/n8n';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    const result = verifyCashfreeWebhook(rawBody, signature, timestamp);

    if (!result.verified) {
      return NextResponse.json({ error: result.error || 'Invalid signature' }, { status: 400 });
    }

    if (result.status === 'PAID') {
      console.log(`[CASHFREE WEBHOOK] Payment verified for Order: ${result.orderNumber}, UTR: ${result.bankUtr}`);

      // Dispatch to n8n marketing workflow
      await dispatchMarketingEvent('order_paid', {
        orderNumber: result.orderNumber,
        gatewayOrderId: result.gatewayOrderId,
        gatewayPaymentId: result.gatewayPaymentId,
        amountInInr: result.amountInInr,
        gateway: 'CASHFREE',
        bankUtr: result.bankUtr,
        paidAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ status: 'ok', processed: result.status });
  } catch (err: any) {
    console.error('Cashfree webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
