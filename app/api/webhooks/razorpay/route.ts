import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhook } from '@/lib/payments/razorpay';
import { dispatchMarketingEvent } from '@/lib/marketing/n8n';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const result = verifyRazorpayWebhook(rawBody, signature);

    if (!result.verified) {
      return NextResponse.json({ error: result.error || 'Invalid signature' }, { status: 400 });
    }

    if (result.status === 'PAID') {
      console.log(`[RAZORPAY WEBHOOK] Payment verified for Order: ${result.orderNumber}, Gateway Order: ${result.gatewayOrderId}, UTR: ${result.bankUtr}`);

      // Dispatch to n8n marketing workflow
      await dispatchMarketingEvent('order_paid', {
        orderNumber: result.orderNumber,
        gatewayOrderId: result.gatewayOrderId,
        gatewayPaymentId: result.gatewayPaymentId,
        amountInInr: result.amountInInr,
        gateway: 'RAZORPAY',
        bankUtr: result.bankUtr,
        paidAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ status: 'ok', processed: result.status });
  } catch (err: any) {
    console.error('Razorpay webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
