import { CreateOrderParams, PaymentOrderResponse, CouponDiscount } from './types';
import { createFamGatewayOrder } from '../famgateway';
import { saveOrder } from '@/lib/orders/store';

// Server-side verified coupon database (Can be backed by Supabase)
const ACTIVE_COUPONS: Record<string, { type: 'PERCENTAGE' | 'FIXED_INR'; value: number; minOrder: number }> = {
  WELCOME10: { type: 'PERCENTAGE', value: 10, minOrder: 50 },
  STUDENT20: { type: 'PERCENTAGE', value: 20, minOrder: 99 },
  MEGA50: { type: 'PERCENTAGE', value: 50, minOrder: 299 },
  DEV10: { type: 'PERCENTAGE', value: 10, minOrder: 0 },
  SAVE25: { type: 'FIXED_INR', value: 25, minOrder: 75 },
};

export function validateAndApplyCoupon(code: string | undefined, subtotalInr: number): CouponDiscount | null {
  if (!code) return null;
  const upperCode = code.trim().toUpperCase();
  const coupon = ACTIVE_COUPONS[upperCode];
  if (!coupon) return null;
  if (subtotalInr < coupon.minOrder) return null;

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = Math.round((subtotalInr * coupon.value) / 100);
  } else {
    discountAmount = Math.min(coupon.value, subtotalInr);
  }

  return {
    code: upperCode,
    discountType: coupon.type,
    discountValue: coupon.value,
    minOrderInr: coupon.minOrder,
    appliedDiscountInr: discountAmount,
  };
}

/**
 * Exclusive FamPay Payment Dispatcher.
 * Exclusively creates dynamic UPI sessions via official FamPay / FamGateway rail.
 */
export async function createUnifiedPaymentOrder(params: CreateOrderParams): Promise<PaymentOrderResponse> {
  const { items, customerEmail, customerPhone, couponCode, currency = 'INR' } = params;

  if (!items || items.length === 0) {
    throw new Error('Cart is empty. Please add at least one ebook.');
  }

  // Calculate subtotal strictly on server
  const subtotal = items.reduce((sum, item) => sum + (item.priceInInr * (item.quantity || 1)), 0);
  const coupon = validateAndApplyCoupon(couponCode, subtotal);
  const discount = coupon ? coupon.appliedDiscountInr : 0;
  const finalAmount = Math.max(1, subtotal - discount);

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const cleanTitle = items[0]?.title ? items[0].title.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '') : 'Ebook Purchase';
  const defaultVpa = process.env.MERCHANT_UPI_VPA || 'wowtarik@yesfam';
  const merchantName = process.env.MERCHANT_NAME || 'AnonTrove';
  const dynamicUpiIntent = `upi://pay?pa=${encodeURIComponent(defaultVpa)}&pn=${encodeURIComponent(merchantName)}&am=${finalAmount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderNumber)}&tn=${encodeURIComponent(cleanTitle)}`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(dynamicUpiIntent)}`;

  const orderTitle = items.length === 1 
    ? items[0].title 
    : `${items.length} eBooks Digital Bundle (${orderNumber})`;

  const baseResponse: PaymentOrderResponse = {
    orderId: orderNumber,
    orderNumber,
    title: orderTitle,
    items: items.map(i => ({ bookId: i.bookId, title: i.title, priceInInr: i.priceInInr })),
    amountInInr: finalAmount,
    amount: finalAmount.toFixed(2),
    currency,
    gateway: 'FAMPAY',
    qrUrl: dynamicQrUrl,
    upiIntent: dynamicUpiIntent,
    upiId: defaultVpa,
    checkoutUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app'}/success?order_id=${orderNumber}`,
  };

  // FamPay direct 0% fee automated UPI QR
  try {
    const fam = await createFamGatewayOrder({
      amount: finalAmount,
      customerEmail,
      customerName: customerEmail ? customerEmail.split('@')[0] : 'Customer',
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app'}/success?order_id=${orderNumber}`,
    });

    const famData = {
      orderId: fam.order_id,
      qrUrl: fam.qr_url,
      upiIntent: fam.upi_intent,
      upiId: fam.upi_id,
      checkoutUrl: fam.checkout_url,
    };

    baseResponse.famgateway = famData;
    baseResponse.fampay = famData;
    baseResponse.orderId = fam.order_id;
    baseResponse.qrUrl = fam.qr_url || dynamicQrUrl;
    baseResponse.upiIntent = fam.upi_intent || dynamicUpiIntent;
    baseResponse.upiId = fam.upi_id || defaultVpa;
    baseResponse.checkoutUrl = fam.checkout_url || baseResponse.checkoutUrl;
  } catch (err) {
    console.warn('[FAMPAY] Upstream API call error; serving dynamic UPI QR:', err);
  }

  saveOrder({
    orderId: baseResponse.orderId,
    orderNumber,
    gatewayOrderId: baseResponse.orderId,
    customerEmail,
    customerPhone,
    items: items.map(i => ({
      bookId: i.bookId,
      title: i.title,
      priceInInr: i.priceInInr,
      fileName: i.fileName,
      format: i.format,
    })),
    subtotalInr: subtotal,
    discountInr: discount,
    totalInr: finalAmount,
    couponCode,
    gateway: 'FAMPAY',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  return baseResponse;
}
