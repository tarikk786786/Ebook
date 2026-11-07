export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * Universal client-side event tracking
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[PostHog Track] ${eventName}:`, properties);
  }

  // If PostHog global exists on window
  const ph = (window as any).posthog;
  if (ph && typeof ph.capture === 'function') {
    ph.capture(eventName, properties);
  }
}

export function trackProductView(book: { id: string; title: string; category: string; priceInInr: number }) {
  trackEvent('product_viewed', {
    book_id: book.id,
    title: book.title,
    category: book.category,
    price_inr: book.priceInInr,
  });
}

export function trackAddToCart(book: { id: string; title: string; priceInInr: number }) {
  trackEvent('add_to_cart', {
    book_id: book.id,
    title: book.title,
    price_inr: book.priceInInr,
  });
}

export function trackInitiateCheckout(itemCount: number, subtotal: number) {
  trackEvent('checkout_initiated', {
    item_count: itemCount,
    subtotal_inr: subtotal,
  });
}

export function trackPurchaseSuccess(orderNumber: string, amount: number, gateway: string) {
  trackEvent('order_completed', {
    order_number: orderNumber,
    revenue_inr: amount,
    payment_gateway: gateway,
  });
}
