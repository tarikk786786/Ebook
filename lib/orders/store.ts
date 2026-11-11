import fs from 'fs';
import path from 'path';
import { PaymentStatus } from '@/lib/payments/types';
import { syncOrderToSupabase } from '@/lib/supabase';

export interface OrderItem {
  bookId: string;
  title: string;
  priceInInr: number;
  fileName: string;
  format?: string;
}

export interface StoredOrder {
  orderId: string;
  orderNumber: string;
  gatewayOrderId?: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  couponCode?: string;
  gateway: string;
  status: PaymentStatus | 'PAID';
  createdAt: string;
  paidAt?: string;
  bankUtr?: string;
  issuedTokens?: Array<{
    bookId: string;
    token: string;
    issuedAt: string;
  }>;
}

function getOrdersFilePath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {}
  }
  return path.join(dataDir, 'orders_store.json');
}

// In-memory fallback cache for serverless read/write performance
let memoryOrders: StoredOrder[] | null = null;

export function loadAllOrders(): StoredOrder[] {
  if (memoryOrders) return memoryOrders;
  const filePath = getOrdersFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryOrders = parsed;
        return memoryOrders;
      }
    } catch (e) {
      console.error('Error reading orders_store.json:', e);
    }
  }
  memoryOrders = [];
  return memoryOrders;
}

export function saveOrder(order: StoredOrder): void {
  const orders = loadAllOrders();
  const existingIdx = orders.findIndex(o => o.orderId === order.orderId || o.orderNumber === order.orderNumber);
  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...order };
  } else {
    orders.unshift(order);
  }

  // Keep latest 2,000 orders in disk store
  if (orders.length > 2000) {
    orders.length = 2000;
  }
  memoryOrders = orders;

  try {
    const filePath = getOrdersFilePath();
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving order to disk (read-only filesystem fallback):', e);
  }

  // Asynchronous cloud sync to Supabase PostgreSQL table
  try {
    syncOrderToSupabase(order).catch(() => {});
  } catch {}
}

export function getOrderById(id: string): StoredOrder | undefined {
  const orders = loadAllOrders();
  return orders.find(o => 
    o.orderId === id || 
    o.orderNumber === id || 
    o.gatewayOrderId === id
  );
}

/**
 * Authoritatively retrieves an order checking local memory/disk cache first,
 * falling back to Supabase PostgreSQL database when running in ephemeral serverless runtimes.
 */
export async function findOrderAuthoritative(id: string): Promise<StoredOrder | null> {
  const localOrder = getOrderById(id);
  if (localOrder) return localOrder;

  try {
    const { fetchOrderByOrderId } = await import('@/lib/supabase');
    const cloudOrder = await fetchOrderByOrderId(id);
    if (cloudOrder) {
      saveOrder(cloudOrder);
      return cloudOrder;
    }
  } catch (err) {
    console.warn('[ORDERS STORE] Authoritative cloud lookup failed:', err);
  }

  return null;
}

/**
 * Updates order status according to strict payment lifecycle rules.
 * CRITICAL INVARIANT: A successful payment ('SUCCESS' / 'PAID') can NEVER be reverted by late failure/expiry events.
 */
export function updateOrderStatus(
  orderIdentifier: string,
  newStatus: PaymentStatus,
  details?: { gatewayOrderId?: string; bankUtr?: string; amountInInr?: number }
): StoredOrder | null {
  const order = getOrderById(orderIdentifier);
  if (!order) return null;

  // Protect SUCCESS from being overwritten by late failure, expiry, or cancellation
  const isAlreadySuccess = order.status === 'SUCCESS' || order.status === 'PAID';
  if (isAlreadySuccess && (newStatus === 'FAILED' || newStatus === 'EXPIRED' || newStatus === 'CANCELLED' || newStatus === 'PENDING')) {
    return order;
  }

  order.status = newStatus;
  if (newStatus === 'SUCCESS') {
    order.paidAt = order.paidAt || new Date().toISOString();
  }
  if (details?.gatewayOrderId) order.gatewayOrderId = details.gatewayOrderId;
  if (details?.bankUtr) order.bankUtr = details.bankUtr;

  saveOrder(order);
  return order;
}

export function markOrderPaid(
  orderIdentifier: string, 
  details: { gatewayOrderId?: string; bankUtr?: string; amountInInr?: number }
): StoredOrder | null {
  const prior = getOrderById(orderIdentifier);
  const wasAlreadyPaid =
    prior?.status === 'SUCCESS' || prior?.status === 'PAID';

  const updated = updateOrderStatus(orderIdentifier, 'SUCCESS', details);
  if (updated) {
    if (!wasAlreadyPaid) {
      import('@/lib/orders/paid-side-effects')
        .then(({ runPaidOrderSideEffects }) => runPaidOrderSideEffects(updated))
        .catch(() => {});
    }

    import('@/lib/supabase')
      .then(({ updateSupabaseOrderStatus }) =>
        updateSupabaseOrderStatus(updated.gatewayOrderId || updated.orderId, 'SUCCESS', {
          bankUtr: updated.bankUtr,
          paidAt: updated.paidAt,
        })
      )
      .catch(() => {});
  }
  return updated;
}
