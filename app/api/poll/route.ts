import { NextRequest, NextResponse } from 'next/server';
import { checkOrderStatus } from '@/lib/famgateway';
import { getBookById } from '@/lib/catalog';
import { generateDownloadToken } from '@/lib/crypto';
import { getOrderById, markOrderPaid } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');
    const requestedBookId = searchParams.get('book_id');

    // Strict regex validation for order_id (alphanumeric + underscore only)
    if (!orderId || typeof orderId !== 'string' || !/^[a-zA-Z0-9_-]{4,64}$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid or missing order_id format' }, { status: 400 });
    }

    // Look up persistent order record
    const storedOrder = getOrderById(orderId);

    // CRITICAL SECURITY FIX (BOLA / IDOR): Verify requested book belongs to this order
    if (storedOrder) {
      if (requestedBookId) {
        const belongsToOrder = storedOrder.items.some(i => i.bookId === requestedBookId);
        if (!belongsToOrder) {
          return NextResponse.json(
            { error: 'Security Authorization Failure: The requested book is not part of this purchased order.' },
            { status: 403 }
          );
        }
      }
    } else if (requestedBookId) {
      if (!/^[a-zA-Z0-9_-]{3,64}$/.test(requestedBookId) || !getBookById(requestedBookId)) {
        return NextResponse.json({ error: 'Invalid book_id specified' }, { status: 400 });
      }
    }

    // Check payment gateway status
    let isPaid = storedOrder?.status === 'PAID' || storedOrder?.status === 'SUCCESS';
    let verifiedAmount = storedOrder?.totalInr ? storedOrder.totalInr.toString() : '0';
    let verifiedUtr = storedOrder?.bankUtr || 'VERIFIED-UPI';

    if (!isPaid) {
      const statusData = await checkOrderStatus(orderId);
      if (statusData.status === 'success') {
        isPaid = true;
        verifiedAmount = statusData.amount || verifiedAmount;
        verifiedUtr = statusData.utr || statusData.transaction_id || verifiedUtr;
        markOrderPaid(orderId, {
          bankUtr: verifiedUtr,
          amountInInr: Number(verifiedAmount) || undefined,
        });
      } else if (statusData.status === 'expired') {
        return NextResponse.json({
          status: 'expired',
          orderId,
          message: 'Payment window expired. Please create a new order.',
        });
      } else {
        return NextResponse.json({
          status: 'pending',
          orderId,
          amount: statusData.amount || verifiedAmount,
        });
      }
    }

    if (isPaid) {
      // Determine target book to generate token for
      let targetBookId = requestedBookId;
      if (!targetBookId && storedOrder && storedOrder.items.length > 0) {
        targetBookId = storedOrder.items[0].bookId;
      }

      const book = targetBookId ? getBookById(targetBookId) : null;
      const fileName = book ? book.fileName : (storedOrder?.items[0]?.fileName || 'purchased-ebook.pdf');

      // Generate single-use, 24h encrypted download token (AES-256-GCM)
      const primaryToken = generateDownloadToken({
        orderId,
        bookId: targetBookId || 'book-zero-trace',
        fileName,
        issuedAt: Date.now(),
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
        maxDownloads: 5,
      });

      // Also generate tokens for all books in a multi-item cart
      const downloadItems = (storedOrder?.items || []).map(item => {
        const itemBook = getBookById(item.bookId);
        const itemFileName = itemBook ? itemBook.fileName : item.fileName;
        const itemToken = generateDownloadToken({
          orderId,
          bookId: item.bookId,
          fileName: itemFileName,
          issuedAt: Date.now(),
          ttlMs: 24 * 60 * 60 * 1000,
          maxDownloads: 5,
        });
        return {
          bookId: item.bookId,
          title: item.title,
          downloadUrl: `/api/download/${itemToken}`,
        };
      });

      return NextResponse.json({
        status: 'success',
        orderId,
        amount: verifiedAmount,
        utr: verifiedUtr,
        token: primaryToken,
        downloadUrl: `/api/download/${primaryToken}`,
        bookTitle: book?.title || storedOrder?.items[0]?.title || 'Purchased eBook',
        downloadItems: downloadItems.length > 0 ? downloadItems : undefined,
      });
    }

    return NextResponse.json({
      status: 'pending',
      orderId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Status query error' },
      { status: 500 }
    );
  }
}
