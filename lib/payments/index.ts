import { CreateOrderParams, PaymentOrderResponse, PaymentGatewayType, CouponDiscount } from './types';
import { createRazorpayOrder } from './razorpay';
import { createCashfreeOrder } from './cashfree';
import { createFamGatewayOrder } from '../famgateway';

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
 * Unified Payment Dispatcher: Handles Razorpay, Cashfree, and FamGateway
 */
export async function createUnifiedPaymentOrder(params: CreateOrderParams): Promise<PaymentOrderResponse> {
  const { items, customerEmail, customerPhone, couponCode, gateway = 'RAZORPAY', currency = 'INR' } = params;

  if (!items || items.length === 0) {
    throw new Error('Cart is empty. Please add at least one ebook.');
  }

  // Calculate subtotal strictly on server
  const subtotal = items.reduce((sum, item) => sum + (item.priceInInr * (item.quantity || 1)), 0);
  const coupon = validateAndApplyCoupon(couponCode, subtotal);
  const discount = coupon ? coupon.appliedDiscountInr : 0;
  const finalAmount = Math.max(1, subtotal - discount);

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const baseResponse: PaymentOrderResponse = {
    orderId: orderNumber,
    orderNumber,
    amountInInr: finalAmount,
    currency,
    gateway,
  };

  if (gateway === 'RAZORPAY') {
    const rzp = await createRazorpayOrder(orderNumber, finalAmount, {
      customerEmail,
      itemCount: items.length.toString(),
      couponCode: couponCode || 'NONE',
    });
    baseResponse.razorpay = rzp;
    baseResponse.orderId = rzp.orderId;
    return baseResponse;
  }

  if (gateway === 'CASHFREE') {
    const cf = await createCashfreeOrder(orderNumber, finalAmount, customerEmail, customerPhone);
    baseResponse.cashfree = cf;
    baseResponse.orderId = cf.orderId;
    return baseResponse;
  }

  // Default / Fallback: FamGateway direct 0% fee automated UPI QR
  const fam = await createFamGatewayOrder({
    amount: finalAmount,
    customerEmail,
    customerName: customerEmail.split('@')[0],
    redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app'}/success?order_id=${orderNumber}`,
  });

  baseResponse.famgateway = {
    orderId: fam.order_id,
    qrUrl: fam.qr_url,
    upiIntent: fam.upi_intent,
    upiId: fam.upi_id,
    checkoutUrl: fam.checkout_url,
  };
  baseResponse.orderId = fam.order_id;
  return baseResponse;
}
