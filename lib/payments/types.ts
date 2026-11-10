export type PaymentGatewayType = 'FAMPAY' | 'FAMGATEWAY';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVIEW_REQUIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

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
  amount: string;
  currency: string;
  gateway: PaymentGatewayType;
  title?: string;
  items?: Array<{ bookId: string; title: string; priceInInr: number; coverImage?: string }>;
  subtotalInr?: number;
  discountInr?: number;
  taxInr?: number;
  taxNote?: string;
  qrUrl?: string;
  upiIntent?: string;
  upiId?: string;
  checkoutUrl?: string;
  processingUrl?: string;
  payableAmount?: string;
  expiresAtIst?: string;
  famgateway?: {
    orderId: string;
    qrUrl: string;
    upiIntent: string;
    upiId: string;
    checkoutUrl: string;
    amount?: string;
    payableAmount?: string;
    expiresAtIst?: string;
  };
  fampay?: {
    orderId: string;
    qrUrl: string;
    upiIntent: string;
    upiId: string;
    checkoutUrl: string;
    amount?: string;
    payableAmount?: string;
    expiresAtIst?: string;
  };
}

export interface WebhookResult {
  verified: boolean;
  orderNumber: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amountInInr: number;
  status: PaymentStatus;
  bankUtr?: string;
  error?: string;
}
