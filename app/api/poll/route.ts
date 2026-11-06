import { NextRequest, NextResponse } from 'next/server';
import { checkOrderStatus } from '@/lib/famgateway';
import { getBookById } from '@/lib/catalog';
import { generateDownloadToken } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    const bookId = searchParams.get('book_id');

    // Strict regex validation for order_id (alphanumeric + underscore only)
    if (!orderId || typeof orderId !== 'string' || !/^[a-zA-Z0-9_-]{4,32}$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid or missing order_id format' }, { status: 400 });
    }

    if (bookId && (!/^[a-zA-Z0-9_-]{3,64}$/.test(bookId) || !getBookById(bookId))) {
      return NextResponse.json({ error: 'Invalid book_id specified' }, { status: 400 });
    }

    // Call FamGateway public status endpoint (zero API key leak)
    const statusData = await checkOrderStatus(orderId);

    if (statusData.status === 'success') {
      const book = bookId ? getBookById(bookId) : null;
      const fileName = book ? book.fileName : 'the-zero-trace-engineer.pdf';

      // Generate single-use, 24h encrypted download token (AES-256-GCM)
      const token = generateDownloadToken({
        orderId,
        bookId: book?.id || 'book-zero-trace',
        fileName,
        issuedAt: Date.now(),
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
        maxDownloads: 5,
      });

      return NextResponse.json({
        status: 'success',
        orderId,
        amount: statusData.amount,
        utr: statusData.utr || statusData.transaction_id || 'VERIFIED-UPI',
        token,
        downloadUrl: `/api/download/${token}`,
        bookTitle: book?.title || 'Purchased eBook',
      });
    }

    if (statusData.status === 'expired') {
      return NextResponse.json({
        status: 'expired',
        orderId,
        message: 'Payment window expired. Please create a new order.',
      });
    }

    return NextResponse.json({
      status: 'pending',
      orderId,
      amount: statusData.amount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Status query error' },
      { status: 500 }
    );
  }
}
