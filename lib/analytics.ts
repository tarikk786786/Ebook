/**
 * AnonTrove Client & Server Analytics Dispatcher
 * Tracks ViewContent, AddToCart, InitiateCheckout, Purchase, and Lead events.
 * Gracefully integrates with Google Analytics 4 (gtag), Meta Pixel (fbq), and Umami without cookie spam.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    umami?: { track: (event: string, data?: any) => void };
  }
}

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  currency?: string;
}

export function trackPageView(url: string) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'page_view', { page_location: url });
  }
  if (window.umami) {
    window.umami.track('pageview');
  }
}

export function trackViewItem(item: AnalyticsItem) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: item.currency || 'INR',
      value: item.price,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category }]
    });
  }
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: item.name,
      content_ids: [item.id],
      content_type: 'product',
      value: item.price,
      currency: item.currency || 'INR'
    });
  }
  if (window.umami) {
    window.umami.track('view_item', { title: item.name, price: item.price });
  }
}

export function trackAddToCart(item: AnalyticsItem) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: item.currency || 'INR',
      value: item.price,
      items: [{ item_id: item.id, item_name: item.name, price: item.price }]
    });
  }
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: item.name,
      content_ids: [item.id],
      value: item.price,
      currency: item.currency || 'INR'
    });
  }
  if (window.umami) {
    window.umami.track('add_to_cart', { id: item.id, price: item.price });
  }
}

export function trackInitiateCheckout(items: AnalyticsItem[], totalAmount: number) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: totalAmount,
      items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price }))
    });
  }
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.id),
      value: totalAmount,
      currency: 'INR',
      num_items: items.length
    });
  }
  if (window.umami) {
    window.umami.track('initiate_checkout', { count: items.length, total: totalAmount });
  }
}

export function trackPurchase(orderId: string, items: AnalyticsItem[], totalAmount: number) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'INR',
      value: totalAmount,
      items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price }))
    });
  }
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: items.map(i => i.id),
      value: totalAmount,
      currency: 'INR',
      order_id: orderId
    });
  }
  if (window.umami) {
    window.umami.track('purchase', { orderId, total: totalAmount });
  }
}

export function trackLead(email: string, source: string) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'generate_lead', { lead_source: source });
  }
  if (window.fbq) {
    window.fbq('track', 'Lead', { content_name: source });
  }
  if (window.umami) {
    window.umami.track('newsletter_signup', { source });
  }
}
