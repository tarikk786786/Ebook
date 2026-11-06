import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/catalog';
import { createFamGatewayOrder } from '@/lib/famgateway';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    const { bookId } = body;

    // Strict input pattern validation (prevent injection)
    if (!bookId || typeof bookId !== 'string' || !/^[a-zA-Z0-9_-]{3,64}$/.test(bookId)) {
      return NextResponse.json({ error: 'Invalid or missing bookId format' }, { status: 400 });
    }

    const book = getBookById(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book does not exist in catalog' }, { status: 404 });
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
    return NextResponse.json(
      { error: err.message || 'Payment initialization error' },
      { status: 500 }
    );
  }
}
