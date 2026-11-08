/**
 * FamGateway Client Library (TypeScript / Next.js)
 * Official FamGateway API reference: https://famgateway.in/docs.txt
 * OpenAPI Spec: https://famgateway.in/openapi.json
 * Non-custodial 0.0% fee automated UPI payment gateway.
 */

export interface CreateOrderParams {
  amount: number;
  redirectUrl?: string;
  webhookUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface FamGatewayOrderResponse {
  status: 'success' | 'error';
  message?: string;
  data: {
    order_id: string;
    qr_url: string;
    checkout_url: string;
    upi_id: string;
    amount: string;
    payable_amount: string;
    upi_intent: string;
    created_at_ist: string;
    expires_at_ist: string;
  };
}

export interface OrderStatusResponse {
  status: 'pending' | 'success' | 'expired' | 'failed';
  order_id: string;
  amount: string;
  transaction_id?: string;
  utr?: string;
  sender_name?: string;
  message?: string;
}

export interface VerifyOrderResponse {
  status: 'success' | 'pending' | 'expired' | 'failed';
  data?: {
    order_id: string;
    transaction_id: string;
    amount: number;
    payable_amount: number;
    utr: string;
    sender_name?: string;
    payment_time_ist?: string;
  };
  message?: string;
}

const BASE_URL = process.env.FAMGATEWAY_BASE_URL || 'https://famgateway.in';

/**
 * Creates a new dynamic UPI payment session on FamGateway.
 * Server-to-server call using secret API key.
 */
export async function createFamGatewayOrder(params: CreateOrderParams): Promise<FamGatewayOrderResponse['data']> {
  const rawApiKey = process.env.FAMGATEWAY_API_KEY;
  if (!rawApiKey) {
    throw new Error('FAMGATEWAY_API_KEY environment variable is not configured');
  }
  const apiKey = rawApiKey.replace(/^\uFEFF/, '').trim();

  const payload = {
    api_key: apiKey,
    amount: Number(params.amount).toFixed(2),
    redirect_url: params.redirectUrl,
    webhook_url: params.webhookUrl,
    customer_name: params.customerName || 'Private Customer',
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
  };

  const response = await fetch(`${BASE_URL}/api/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FamGateway order creation HTTP error (${response.status}): ${errorText}`);
  }

  const json: FamGatewayOrderResponse = await response.json();

  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'FamGateway returned unsuccessful status');
  }

  return json.data;
}

/**
 * Checks public order status using FamGateway's zero-leak polling endpoint.
 * Safe to call from client or proxy without exposing API key.
 */
export async function checkOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const url = `${BASE_URL}/api/checkout-status.php?order_id=${encodeURIComponent(orderId)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Status check HTTP error (${response.status})`);
  }

  return await response.json();
}

/**
 * Authoritative Server-to-Server Order Verification using FamGateway's authenticated API.
 * Uses X-Api-Key to fetch bank UTR and authoritative confirmation.
 */
export async function verifyFamGatewayOrder(orderId: string): Promise<VerifyOrderResponse> {
  const rawApiKey = process.env.FAMGATEWAY_API_KEY;
  if (!rawApiKey) {
    throw new Error('FAMGATEWAY_API_KEY environment variable is not configured');
  }
  const apiKey = rawApiKey.replace(/^\uFEFF/, '').trim();

  const url = `${BASE_URL}/api/verify-order.php?order_id=${encodeURIComponent(orderId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Api-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 408) {
      return { status: 'expired', message: 'Order expired - payment window timed out' };
    }
    if (response.status === 404) {
      return { status: 'failed', message: 'Order not found' };
    }
    if (response.status === 401) {
      throw new Error('FamGateway API authentication failed (invalid API key)');
    }
    throw new Error(`FamGateway order verification HTTP error (${response.status})`);
  }

  return await response.json();
}
