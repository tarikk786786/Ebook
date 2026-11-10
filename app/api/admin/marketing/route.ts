import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getAffiliates } from '@/lib/affiliate';
import { CURATED_BUNDLES } from '@/lib/bundles';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const cwd = process.cwd();
    const dataDir = path.join(cwd, 'data');

    // Read Subscribers
    const subscribersFile = path.join(dataDir, 'subscribers.json');
    let subscribers: any[] = [];
    if (fs.existsSync(subscribersFile)) {
      try {
        subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
      } catch {}
    }

    // Read Affiliates
    const affiliates = getAffiliates();

    // Read Orders from authoritative FamGateway store
    const ordersFile = path.join(dataDir, 'orders_store.json');
    let orders: any[] = [];
    if (fs.existsSync(ordersFile)) {
      try {
        orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
      } catch {}
    }

    // Calculate real numbers (zero fake simulations)
    const totalSubscribers = subscribers.length;
    const totalAffiliates = affiliates.length;
    const paidOrders = orders.filter(
      (o) => o.status === 'SUCCESS' || o.status === 'PAID'
    );
    const totalOrdersCount = paidOrders.length;
    const totalRevenueInInr = paidOrders.reduce(
      (sum, o) => sum + (Number(o.totalInr ?? o.amount) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalSubscribers,
        totalAffiliates,
        totalOrdersCount,
        totalRevenueInInr,
        averageOrderValueInInr: totalOrdersCount > 0 ? Math.round(totalRevenueInInr / totalOrdersCount) : 0,
        activeBundlesCount: CURATED_BUNDLES.length,
      },
      subscribers: subscribers.slice(-50).reverse(),
      affiliates,
      bundles: CURATED_BUNDLES
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching marketing metrics' },
      { status: 500 }
    );
  }
}
