const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

export type MarketingEventType = 
  | 'order_paid'
  | 'cart_abandoned'
  | 'lead_magnet_claimed'
  | 'review_submitted'
  | 'newsletter_subscribed';

/**
 * Dispatches an event to n8n marketing workflows asynchronously
 */
export async function dispatchMarketingEvent(
  eventType: MarketingEventType,
  payload: Record<string, any>
): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    // Development log
    console.log(`[n8n Marketing Event] ${eventType}:`, payload);
    return true;
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AnonTrove-Event': eventType,
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error(`Failed to dispatch n8n event ${eventType}:`, err);
    return false;
  }
}
