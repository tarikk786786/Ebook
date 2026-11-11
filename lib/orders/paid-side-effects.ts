import type { StoredOrder } from '@/lib/orders/store';
import { creditContributorEarningsForPaidOrder } from '@/lib/community/ledger';

/**
 * Non-blocking side effects after an order transitions to paid (webhook + poll paths).
 * Fulfillment tokens remain authoritative; ledger failures must not fail checkout.
 */
export function runPaidOrderSideEffects(order: StoredOrder): void {
  try {
    const result = creditContributorEarningsForPaidOrder(order);
    const credited = result.lines.filter((l) => l.result.status === 'credited').length;
    const duplicate = result.lines.filter((l) => l.result.status === 'duplicate').length;
    if (credited > 0 || duplicate > 0) {
      console.info(
        `[paid-side-effects] order=${order.orderId} credits=${credited} idempotent_hits=${duplicate}`,
      );
    }
  } catch (err) {
    console.warn('[paid-side-effects] Community earnings credit failed (non-blocking):', err);
  }
}
