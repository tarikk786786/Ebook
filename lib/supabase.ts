/**
 * Supabase Zero-Dependency REST Client (PostgREST)
 * Provides durable cloud persistence for orders and catalog without external SDK overhead.
 */

import { StoredOrder } from '@/lib/orders/store';
import { getBookById } from '@/lib/catalog';

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
        'Prefer': 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    let orderUuid: string | null = null;
    if (res.ok) {
      try {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.id) {
          orderUuid = rows[0].id;
        }
      } catch {}
    }

    // Fallback: If merge didn't return representation, retrieve UUID by unique order_number
    if (!orderUuid) {
      try {
        const lookupRes = await fetch(
          `${SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(order.orderNumber)}&select=id`,
          { method: 'GET', headers: getHeaders(), cache: 'no-store' }
        );
        if (lookupRes.ok) {
          const lookupRows = await lookupRes.json();
          if (Array.isArray(lookupRows) && lookupRows[0]?.id) {
            orderUuid = lookupRows[0].id;
          }
        }
      } catch {}
    }

    // Persist itemized entitlements to public.order_items (VULN-008 Fix)
    if (orderUuid && Array.isArray(order.items) && order.items.length > 0) {
      try {
        const itemsPayload = order.items.map(item => ({
          order_id: orderUuid,
          book_id: item.bookId,
          price_at_purchase: Math.round(item.priceInInr || 0),
        }));

        await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(itemsPayload),
        });
      } catch (itemErr) {
        console.warn('[SUPABASE] Non-blocking order_items sync warning:', itemErr);
      }
    }

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

/**
 * Authoritatively retrieves an order by order_id or order_number from Supabase.
 */
export async function fetchOrderByOrderId(orderId: string): Promise<StoredOrder | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const encodedId = encodeURIComponent(orderId);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?or=(gateway_order_id.eq.${encodedId},order_number.eq.${encodedId})&select=*`,
      {
        method: 'GET',
        headers: getHeaders(),
        cache: 'no-store',
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const row = rows[0];

    // Query itemized purchases
    let items: any[] = [];
    try {
      const itemsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${encodeURIComponent(row.id)}&select=*`,
        { method: 'GET', headers: getHeaders(), cache: 'no-store' }
      );
      if (itemsRes.ok) {
        const itemRows = await itemsRes.json();
        if (Array.isArray(itemRows)) {
          items = itemRows.map(it => {
            const catalogBook = getBookById(it.book_id);
            return {
              bookId: it.book_id,
              title: it.title || catalogBook?.title || it.book_id,
              priceInInr: it.price_at_purchase || catalogBook?.priceInInr || 0,
              fileName: it.file_name || catalogBook?.fileName || `${it.book_id}.pdf`,
              format: catalogBook?.format || 'PDF',
            };
          });
        }
      }
    } catch {}

    return {
      orderId: row.gateway_order_id || row.order_number,
      orderNumber: row.order_number,
      gatewayOrderId: row.gateway_order_id,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      items,
      subtotalInr: row.subtotal_inr,
      discountInr: row.discount_inr || 0,
      totalInr: row.total_inr,
      couponCode: row.coupon_code,
      gateway: row.gateway || 'FAMPAY',
      status: row.status,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      bankUtr: row.bank_utr,
    };
  } catch (err) {
    console.warn('[SUPABASE] fetchOrderByOrderId failure:', err);
    return null;
  }
}

/**
 * Records an immutable event in public.security_audit_logs.
 */
export async function recordSecurityAuditLog(
  eventType: string,
  metadata: Record<string, any> = {},
  actorEmail?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/security_audit_logs`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        event_type: eventType,
        actor_email: actorEmail || null,
        metadata,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SUPABASE] Audit log write failure:', err);
    return false;
  }
}

/**
 * Checks whether a specific webhook event key has already been processed and logged in Supabase.
 */
export async function isWebhookEventProcessed(eventKey: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/security_audit_logs?event_type=eq.WEBHOOK_PROCESSED&metadata->>event_key=eq.${encodeURIComponent(eventKey)}&select=id&limit=1`,
      {
        method: 'GET',
        headers: getHeaders(),
        cache: 'no-store',
      }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    console.warn('[SUPABASE] Idempotency check error:', err);
    return false;
  }
}

/**
 * Records a processed webhook event into public.security_audit_logs for cross-instance idempotency.
 */
export async function recordWebhookEventProcessed(
  eventKey: string,
  details: Record<string, any> = {}
): Promise<boolean> {
  return recordSecurityAuditLog('WEBHOOK_PROCESSED', {
    event_key: eventKey,
    ...details,
    recorded_at: new Date().toISOString(),
  });
}
