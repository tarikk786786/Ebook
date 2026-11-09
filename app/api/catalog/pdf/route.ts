import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const filePath = path.join(process.cwd(), 'public', 'AnonTrove_Complete_86k_Ebooks_Directory.pdf');

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Catalogue PDF directory not found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  // Convert Node ReadStream to Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => controller.enqueue(chunk));
      fileStream.on('end', () => controller.close());
      fileStream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': stat.size.toString(),
      'Content-Disposition': 'attachment; filename="AnonTrove_Complete_86k_Ebooks_Directory.pdf"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
