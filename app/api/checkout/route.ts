import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookById } from '@/lib/catalog';
import { createUnifiedPaymentOrder } from '@/lib/payments';
import { CartItem, PaymentGatewayType } from '@/lib/payments/types';
import { checkRateLimit } from '@/lib/rate-limit';

const CheckoutItemSchema = z.object({
  bookId: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'bookId contains invalid characters'),
  quantity: z.number().int().positive().max(10).optional().default(1),
});

const CheckoutRequestSchema = z.object({
  bookId: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'bookId contains invalid characters').optional(),
  items: z.array(CheckoutItemSchema).max(50).optional(),
  customerEmail: z.string().email('Invalid email address format').max(128).optional().default('reader@anontrove.internal'),
  customerPhone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').max(16).optional(),
  couponCode: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid coupon format').optional(),
  gateway: z.enum(['FAMGATEWAY', 'FAMPAY']).optional().default('FAMGATEWAY'),
}).refine(data => Boolean(data.bookId || (data.items && data.items.length > 0)), {
  message: 'Either bookId or a non-empty items array must be provided for checkout',
});

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

    const parseResult = CheckoutRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid checkout request data',
          issues: parseResult.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { bookId, items, customerEmail, customerPhone, couponCode, gateway } = parseResult.data;

    let checkoutItems: CartItem[] = [];

    // Support 1: Single-click Buy Now
    if (bookId) {
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
    else if (items && items.length > 0) {
      for (const rawItem of items) {
        const verifiedBook = getBookById(rawItem.bookId);
        if (!verifiedBook) {
          return NextResponse.json({ error: `Item ${rawItem.bookId} is not available in catalog` }, { status: 400 });
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
          quantity: rawItem.quantity || 1,
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
