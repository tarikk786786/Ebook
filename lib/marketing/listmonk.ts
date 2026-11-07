const LISTMONK_URL = process.env.LISTMONK_URL || '';
const LISTMONK_USERNAME = process.env.LISTMONK_USERNAME || '';
const LISTMONK_PASSWORD = process.env.LISTMONK_PASSWORD || '';

export interface SendOrderEmailParams {
  toEmail: string;
  orderNumber: string;
  totalInr: number;
  items: Array<{ title: string; format: string; price: number }>;
  downloadLink: string;
}

/**
 * Sends a transactional purchase confirmation email via Listmonk
 */
export async function sendOrderConfirmationEmail(params: SendOrderEmailParams): Promise<boolean> {
  const { toEmail, orderNumber, totalInr, items, downloadLink } = params;

  if (!LISTMONK_URL || !LISTMONK_USERNAME || !LISTMONK_PASSWORD) {
    console.log(`[Listmonk Mock Email] Order confirmation dispatched to ${toEmail} for ${orderNumber}`);
    return true;
  }

  try {
    const authHeader = Buffer.from(`${LISTMONK_USERNAME}:${LISTMONK_PASSWORD}`).toString('base64');
    const res = await fetch(`${LISTMONK_URL}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        subscriber_email: toEmail,
        template_id: Number(process.env.LISTMONK_ORDER_TEMPLATE_ID) || 1,
        data: {
          orderNumber,
          totalInr,
          items,
          downloadLink,
          storeName: 'AnonTrove',
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Listmonk send error:', err);
    return false;
  }
}
