import { NextRequest, NextResponse } from 'next/server';
import { findOrderAuthoritative } from '@/lib/orders/store';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = checkRateLimit(`order-lookup-${ip}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many lookup attempts. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { orderIdentifier, verificationContact } = body;

    if (!orderIdentifier || typeof orderIdentifier !== 'string' || orderIdentifier.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Valid Order ID or Reference is required.' },
        { status: 400 }
      );
    }

    if (!verificationContact || typeof verificationContact !== 'string' || verificationContact.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Verification email or mobile number is required to verify ownership.' },
        { status: 400 }
      );
    }

    const cleanId = orderIdentifier.trim();
    const cleanContact = verificationContact.trim().toLowerCase();

    const order = await findOrderAuthoritative(cleanId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order found matching the provided reference and contact information.' },
        { status: 404 }
      );
    }

    // Strict ownership verification:
    // Email match or phone match
    const orderEmail = (order.customerEmail || '').trim().toLowerCase();
    const orderPhone = (order.customerPhone || '').replace(/\D/g, '');
    const candidatePhone = cleanContact.replace(/\D/g, '');

    const emailMatches = orderEmail && orderEmail === cleanContact;
    const phoneMatches = orderPhone && candidatePhone.length >= 10 && orderPhone.endsWith(candidatePhone);

    if (!emailMatches && !phoneMatches) {
      return NextResponse.json(
        { success: false, error: 'Ownership verification failed. The provided contact details do not match this order.' },
        { status: 403 }
      );
    }

    // Mask sensitive details before sending to client
    const maskedUtr = order.bankUtr 
      ? (order.bankUtr.length > 4 ? `****${order.bankUtr.slice(-4)}` : 'VERIFIED')
      : 'CONFIRMED';

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        amountInInr: order.totalInr,
        status: order.status,
        gateway: order.gateway || 'UPI',
        bankUtr: maskedUtr,
        items: (order.items || []).map((it) => ({
          bookId: it.bookId,
          title: it.title,
          price: it.priceInInr,
          format: it.format || 'PDF',
          token: order.issuedTokens?.find((t) => t.bookId === it.bookId)?.token || null,
        })),
      },
    });
  } catch (err: any) {
    console.error('[Order Lookup Error]:', err);
    return NextResponse.json(
      { success: false, error: 'An error occurred while verifying the order.' },
      { status: 500 }
    );
  }
}
