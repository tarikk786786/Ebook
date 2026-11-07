import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/catalog';
import { createUnifiedPaymentOrder } from '@/lib/payments';
import { CartItem, PaymentGatewayType } from '@/lib/payments/types';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous-ip';
    const rateCheck = checkRateLimit(`checkout:${ip}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before retrying checkout.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
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
    // Support 2: Multi-item Cart (Strict Server-Side Price Verification)
    else if (Array.isArray(items) && items.length > 0) {
      for (const rawItem of items) {
        const rawBookId = String(rawItem.bookId || '');
        if (!rawBookId || !/^[a-zA-Z0-9_-]{3,64}$/.test(rawBookId)) {
          return NextResponse.json({ error: 'Invalid bookId format in cart items' }, { status: 400 });
        }
        const verifiedBook = getBookById(rawBookId);
        if (!verifiedBook) {
          return NextResponse.json({ error: `Item ${rawBookId} is not available in catalog` }, { status: 400 });
        }

        checkoutItems.push({
          bookId: verifiedBook.id,
          title: verifiedBook.title,
          author: verifiedBook.author,
          // CRITICAL: Always use server catalog price; discard any client price tampering
          priceInInr: verifiedBook.priceInInr,
          originalPriceInInr: verifiedBook.originalPriceInInr,
          format: verifiedBook.format,
          coverImage: verifiedBook.coverImage,
          fileName: verifiedBook.fileName,
          quantity: 1,
        });
      }
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
