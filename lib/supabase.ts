/**
 * Supabase Zero-Dependency REST Client (PostgREST)
 * Provides durable cloud persistence for orders and catalog without external SDK overhead.
 */

import { StoredOrder } from '@/lib/orders/store';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal',
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Persists an order to Supabase PostgreSQL table `public.orders`.
 * Gracefully logs and continues on network timeout or schema mismatches.
 */
export async function syncOrderToSupabase(order: StoredOrder): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload = {
      order_number: order.orderNumber,
      gateway_order_id: order.gatewayOrderId || order.orderId,
      customer_email: order.customerEmail || 'reader@anontrove.internal',
      customer_phone: order.customerPhone || null,
      subtotal_inr: Math.round(order.subtotalInr),
      discount_inr: Math.round(order.discountInr),
      total_inr: Math.round(order.totalInr),
      coupon_code: order.couponCode || null,
      gateway: order.gateway || 'FAMPAY',
      status: order.status === 'PAID' ? 'PAID' : (order.status === 'SUCCESS' ? 'PAID' : 'PENDING'),
      bank_utr: order.bankUtr || null,
      paid_at: order.paidAt || null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn('[SUPABASE] Non-blocking sync failure for order:', order.orderNumber, err);
    return false;
  }
}

/**
 * Updates order status in Supabase table.
 */
export async function updateSupabaseOrderStatus(
  orderId: string,
  status: string,
  details?: { bankUtr?: string; paidAt?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const updatePayload: Record<string, any> = {
      status: status === 'SUCCESS' ? 'PAID' : status,
    };
    if (details?.bankUtr) updatePayload.bank_utr = details.bankUtr;
    if (details?.paidAt) updatePayload.paid_at = details.paidAt;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?gateway_order_id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updatePayload),
    });

    return res.ok;
  } catch (err) {
    console.warn('[SUPABASE] Non-blocking status update error:', err);
    return false;
  }
}
