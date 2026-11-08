import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { verifyAdminAccess } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  try {
    const storage = getStorageAdapter();
    const [connTest, usage] = await Promise.all([
      storage.testConnection(),
      storage.getStorageUsage().catch(err => ({
        totalBytes: 0,
        objectCount: 0,
        provider: storage.provider,
        bucket: undefined,
        error: err.message
      }))
    ]);

    const totalGb = (usage.totalBytes / (1024 ** 3)).toFixed(2);
    const targetCapacityGb = 5120; // 5 TB
    const usagePercent = ((usage.totalBytes / (5 * 1024 ** 4)) * 100).toFixed(2);

    return NextResponse.json({
      success: true,
      provider: storage.provider,
      connection: connTest,
      stats: {
        totalBytes: usage.totalBytes,
        totalGb: `${totalGb} GB`,
        objectCount: usage.objectCount,
        targetCapacityGb: `${targetCapacityGb} GB (5 TB)`,
        usagePercent: `${usagePercent}%`,
        bucket: usage.bucket || 'private_storage',
      },
      envConfigured: {
        hasB2Keys: Boolean(process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY),
        b2Endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
        b2Bucket: process.env.B2_BUCKET_NAME || 'anontrove-private-vault',
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
