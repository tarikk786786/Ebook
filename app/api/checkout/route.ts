import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/catalog';
import { createFamGatewayOrder } from '@/lib/famgateway';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    const book = getBookById(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const redirectUrl = `${siteUrl}/success?book_id=${encodeURIComponent(book.id)}`;
    const webhookUrl = `${siteUrl}/api/webhooks/famgateway`;

    // Create non-custodial FamGateway UPI Order
    // Zero PII collected: no real phone/email passed to external parties
    const orderData = await createFamGatewayOrder({
      amount: book.priceInInr,
      redirectUrl,
      webhookUrl,
      customerName: 'Private Reader',
    });

    return NextResponse.json({
      status: 'success',
      data: {
        orderId: orderData.order_id,
        amount: orderData.payable_amount || orderData.amount,
        qrUrl: orderData.qr_url,
        checkoutUrl: orderData.checkout_url,
        upiIntent: orderData.upi_intent,
        upiId: orderData.upi_id,
        book: {
          id: book.id,
          title: book.title,
          priceInInr: book.priceInInr,
          format: book.format,
        },
      },
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize payment order' },
      { status: 500 }
    );
  }
}
