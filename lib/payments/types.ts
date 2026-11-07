export type PaymentGatewayType = 'RAZORPAY' | 'CASHFREE' | 'FAMGATEWAY';

export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  priceInInr: number;
  originalPriceInInr: number;
  format: string;
  coverImage: string;
  fileName: string;
  quantity: number;
}

export interface CouponDiscount {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_INR';
  discountValue: number;
  minOrderInr: number;
  appliedDiscountInr: number;
}

export interface CreateOrderParams {
  items: CartItem[];
  customerEmail: string;
  customerPhone?: string;
  couponCode?: string;
  gateway?: PaymentGatewayType;
  currency?: 'INR' | 'USD';
}

export interface PaymentOrderResponse {
  orderId: string;
  orderNumber: string;
  amountInInr: number;
  currency: string;
  gateway: PaymentGatewayType;
  // Gateway-specific fields
  razorpay?: {
    orderId: string;
    keyId: string;
    amountInPaise: number;
  };
  cashfree?: {
    orderId: string;
    paymentSessionId: string;
    orderExpiryTime: string;
  };
  famgateway?: {
    orderId: string;
    qrUrl: string;
    upiIntent: string;
    upiId: string;
    checkoutUrl: string;
  };
}

export interface WebhookResult {
  verified: boolean;
  orderNumber: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amountInInr: number;
  status: 'PAID' | 'FAILED' | 'PENDING';
  bankUtr?: string;
  error?: string;
}
