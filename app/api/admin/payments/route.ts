import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { loadAllOrders, findOrderAuthoritative } from '@/lib/orders/store';
import { verifyFamGatewayOrder } from '@/lib/famgateway';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const status = (searchParams.get('status') || '').toUpperCase();
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
  const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

  const orders = loadAllOrders();
  const success = orders.filter((o) => o.status === 'SUCCESS' || o.status === 'PAID');
  const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'CREATED');
  const failed = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED');
  const expired = orders.filter((o) => o.status === 'EXPIRED');
  const refunds = orders.filter((o) => o.status === 'REFUNDED' || o.status === 'REFUND_PENDING');
  const revenue = success.reduce((sum, o) => sum + (Number(o.totalInr) || 0), 0);

  const byDay: Record<string, { count: number; revenue: number }> = {};
  for (const o of success) {
    const day = (o.paidAt || o.createdAt || '').slice(0, 10) || 'unknown';
    if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
    byDay[day].count += 1;
    byDay[day].revenue += Number(o.totalInr) || 0;
  }

  let filtered = orders;
  if (status) {
    filtered = filtered.filter((o) => String(o.status).toUpperCase() === status || (status === 'SUCCESS' && o.status === 'PAID'));
  }
  if (q) {
    filtered = filtered.filter((o) => {
      const hay = [
        o.orderId,
        o.orderNumber,
        o.gatewayOrderId,
        o.customerEmail,
        o.customerPhone,
        o.bankUtr,
        ...(o.items || []).map((i) => i.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const page = filtered.slice(offset, offset + limit).map((o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    gatewayOrderId: o.gatewayOrderId,
    gateway: o.gateway,
    status: o.status,
    totalInr: o.totalInr,
    customerEmail: o.customerEmail,
    bankUtr: o.bankUtr ? `${String(o.bankUtr).slice(0, 4)}…${String(o.bankUtr).slice(-4)}` : null,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    itemCount: o.items?.length || 0,
    titles: (o.items || []).map((i) => i.title).slice(0, 3),
  }));

  return NextResponse.json({
    success: true,
    summary: {
      totalOrders: orders.length,
      successfulPayments: success.length,
      pendingPayments: pending.length,
      failedTransactions: failed.length,
      expiredPayments: expired.length,
      refunds: refunds.length,
      totalConfirmedRevenueInr: revenue,
      gateway: 'FAMGATEWAY',
      famGatewayConfigured: Boolean(process.env.FAMGATEWAY_API_KEY),
      webhookSecretConfigured: Boolean(process.env.FAMGATEWAY_WEBHOOK_SECRET || process.env.FAMGATEWAY_API_KEY),
    },
    dailyActivity: Object.entries(byDay)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30)
      .map(([day, v]) => ({ day, ...v })),
    orders: page,
    total: filtered.length,
    limit,
    offset,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = String(body.action || '');
  if (action === 'verify') {
    const orderId = String(body.orderId || '');
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId required' }, { status: 400 });
    }
    const local = await findOrderAuthoritative(orderId);
    let gateway: unknown = null;
    try {
      gateway = await verifyFamGatewayOrder(local?.gatewayOrderId || orderId);
    } catch (e: any) {
      gateway = { error: e?.message || 'verify failed' };
    }
    return NextResponse.json({
      success: true,
      local: local
        ? {
            orderId: local.orderId,
            orderNumber: local.orderNumber,
            status: local.status,
            totalInr: local.totalInr,
            bankUtr: local.bankUtr,
            paidAt: local.paidAt,
            gateway: local.gateway,
          }
        : null,
      gateway,
    });
  }

  if (action === 'export') {
    const orders = loadAllOrders();
    const header = [
      'orderId',
      'orderNumber',
      'gatewayOrderId',
      'status',
      'totalInr',
      'customerEmail',
      'bankUtr',
      'createdAt',
      'paidAt',
      'gateway',
    ];
    const lines = [header.join(',')];
    for (const o of orders) {
      lines.push(
        [
          o.orderId,
          o.orderNumber,
          o.gatewayOrderId || '',
          o.status,
          o.totalInr,
          o.customerEmail,
          o.bankUtr || '',
          o.createdAt,
          o.paidAt || '',
          o.gateway,
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
    }
    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="famgateway_payments.csv"',
      },
    });
  }

  return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
}
