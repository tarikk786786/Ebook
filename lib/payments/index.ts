import { CreateOrderParams, PaymentOrderResponse, CouponDiscount } from './types';
import { createFamGatewayOrder } from '../famgateway';
import { saveOrder } from '@/lib/orders/store';
import QRCode from 'qrcode';

const ACTIVE_COUPONS: Record<string, { type: 'PERCENTAGE' | 'FIXED_INR'; value: number; minOrder: number }> = {
  WELCOME10: { type: 'PERCENTAGE', value: 10, minOrder: 50 },
  STUDENT20: { type: 'PERCENTAGE', value: 20, minOrder: 99 },
  MEGA50: { type: 'PERCENTAGE', value: 50, minOrder: 299 },
  DEV10: { type: 'PERCENTAGE', value: 10, minOrder: 0 },
  SAVE25: { type: 'FIXED_INR', value: 25, minOrder: 75 },
};

const SITE_URL = () =>
  (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app').replace(
    /\/$/,
    ''
  );

/** Download entitlement TTL after verified payment (AES token lifetime). */
export const DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;

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
 * FamGateway-only payment dispatcher.
 * Creates pending internal order, then FamGateway session (hosted checkout + generic UPI intent + QR).
 * Does not fabricate app-specific UPI deep links — OS/app chooser uses gateway upi_intent.
 */
export async function createUnifiedPaymentOrder(params: CreateOrderParams): Promise<PaymentOrderResponse> {
  const { items, customerEmail, customerPhone, couponCode, currency = 'INR' } = params;

  if (!items || items.length === 0) {
    throw new Error('Cart is empty. Please add at least one ebook.');
  }

  const subtotal = items.reduce((sum, item) => sum + item.priceInInr * (item.quantity || 1), 0);
  const coupon = validateAndApplyCoupon(couponCode, subtotal);
  const discount = coupon ? coupon.appliedDiscountInr : 0;
  const taxInr = 0;
  const finalAmount = Math.max(1, subtotal - discount + taxInr);

  const merchantOrderRef = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const cleanTitle = items[0]?.title
    ? items[0].title.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '')
    : 'Ebook Purchase';
  const defaultVpa = process.env.MERCHANT_UPI_VPA || 'wowtarik@yesfam';
  const merchantName = process.env.MERCHANT_NAME || 'AnonTrove';

  const fallbackUpiIntent = `upi://pay?pa=${encodeURIComponent(defaultVpa)}&pn=${encodeURIComponent(merchantName)}&am=${finalAmount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(merchantOrderRef)}&tn=${encodeURIComponent(cleanTitle)}`;

  let fallbackQrUrl = '';
  try {
    fallbackQrUrl = await QRCode.toDataURL(fallbackUpiIntent, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (qrErr) {
    console.warn('[QR] Local QR generation error:', qrErr);
  }

  const orderTitle =
    items.length === 1 ? items[0].title : `${items.length} eBooks Digital Bundle (${merchantOrderRef})`;

  const processingUrl = `${SITE_URL()}/payment/processing?order_id=${encodeURIComponent(merchantOrderRef)}`;

  saveOrder({
    orderId: merchantOrderRef,
    orderNumber: merchantOrderRef,
    gatewayOrderId: merchantOrderRef,
    customerEmail,
    customerPhone,
    items: items.map((i) => ({
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
    gateway: 'FAMGATEWAY',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  const baseResponse: PaymentOrderResponse = {
    orderId: merchantOrderRef,
    orderNumber: merchantOrderRef,
    title: orderTitle,
    items: items.map((i) => ({
      bookId: i.bookId,
      title: i.title,
      priceInInr: i.priceInInr,
      coverImage: i.coverImage,
    })),
    amountInInr: finalAmount,
    amount: finalAmount.toFixed(2),
    currency,
    gateway: 'FAMGATEWAY',
    subtotalInr: subtotal,
    discountInr: discount,
    taxInr,
    taxNote: 'Inclusive pricing — no additional checkout tax applied',
    qrUrl: fallbackQrUrl,
    upiIntent: fallbackUpiIntent,
    upiId: defaultVpa,
    checkoutUrl: processingUrl,
    processingUrl,
  };

  try {
    const fam = await createFamGatewayOrder({
      amount: finalAmount,
      customerEmail,
      customerName: customerEmail ? customerEmail.split('@')[0] : 'Customer',
      customerPhone,
      redirectUrl: `${SITE_URL()}/payment/processing?order_id=${encodeURIComponent(merchantOrderRef)}`,
      webhookUrl: `${SITE_URL()}/api/webhooks/famgateway`,
    });

    const famData = {
      orderId: fam.order_id,
      qrUrl: fam.qr_url,
      upiIntent: fam.upi_intent,
      upiId: fam.upi_id,
      checkoutUrl: fam.checkout_url,
      amount: fam.amount,
      payableAmount: fam.payable_amount,
      expiresAtIst: fam.expires_at_ist,
    };

    baseResponse.famgateway = famData;
    baseResponse.fampay = famData;
    baseResponse.orderId = fam.order_id;
    baseResponse.qrUrl = fam.qr_url || fallbackQrUrl;
    baseResponse.upiIntent = fam.upi_intent || fallbackUpiIntent;
    baseResponse.upiId = fam.upi_id || defaultVpa;
    baseResponse.checkoutUrl = fam.checkout_url;
    baseResponse.processingUrl = `${SITE_URL()}/payment/processing?order_id=${encodeURIComponent(fam.order_id)}`;
    baseResponse.expiresAtIst = fam.expires_at_ist;
    baseResponse.payableAmount = fam.payable_amount;

    saveOrder({
      orderId: fam.order_id,
      orderNumber: merchantOrderRef,
      gatewayOrderId: fam.order_id,
      customerEmail,
      customerPhone,
      items: items.map((i) => ({
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
      gateway: 'FAMGATEWAY',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[FAMGATEWAY] Upstream create-order failed; local QR/intent fallback only:', err);
  }

  return baseResponse;
}
