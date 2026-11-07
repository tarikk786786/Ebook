import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/catalog';
import { createUnifiedPaymentOrder } from '@/lib/payments';
import { CartItem, PaymentGatewayType } from '@/lib/payments/types';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    const { bookId, items, customerEmail = 'reader@anontrove.internal', customerPhone, couponCode, gateway = 'FAMGATEWAY' } = body;

    let checkoutItems: CartItem[] = [];

    // Support 1: Single-click Buy Now
    if (bookId) {
      if (typeof bookId !== 'string' || !/^[a-zA-Z0-9_-]{3,64}$/.test(bookId)) {
        return NextResponse.json({ error: 'Invalid or missing bookId format' }, { status: 400 });
      }

      const book = getBookById(bookId);
      if (!book) {
        return NextResponse.json({ error: 'Book does not exist in catalog' }, { status: 404 });
      }

      checkoutItems = [
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          priceInInr: book.priceInInr,
          originalPriceInInr: book.originalPriceInInr,
          format: book.format,
          coverImage: book.coverImage,
          fileName: book.fileName,
          quantity: 1,
        },
      ];
    } 
    // Support 2: Multi-item Cart
    else if (Array.isArray(items) && items.length > 0) {
      checkoutItems = items.map((i: any) => ({
        bookId: String(i.bookId),
        title: String(i.title),
        author: String(i.author || 'Author'),
        priceInInr: Number(i.priceInInr) || 29,
        originalPriceInInr: Number(i.originalPriceInInr) || 499,
        format: String(i.format || 'PDF'),
        coverImage: String(i.coverImage || ''),
        fileName: String(i.fileName || 'book.pdf'),
        quantity: 1,
      }));
    } else {
      return NextResponse.json({ error: 'No items provided for checkout' }, { status: 400 });
    }

    const orderResponse = await createUnifiedPaymentOrder({
      items: checkoutItems,
      customerEmail,
      customerPhone,
      couponCode,
      gateway: gateway as PaymentGatewayType,
    });

    return NextResponse.json({
      status: 'success',
      data: orderResponse,
    });
  } catch (err: any) {
    console.error('Checkout API error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}
