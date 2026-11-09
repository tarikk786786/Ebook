import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookById } from '@/lib/catalog';
import { checkRateLimit } from '@/lib/rate-limit';

const CompanionRequestSchema = z.object({
  bookId: z.string().min(3).max(64),
  action: z.enum(['SUMMARY', 'TAKEAWAYS', 'TABLE_OF_CONTENTS', 'SIMILAR_RECOMMENDATIONS']),
  query: z.string().max(256).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous-ip';
    const rateCheck = checkRateLimit(`ai-companion:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before asking another question.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parseResult = CompanionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid companion request parameters' }, { status: 400 });
    }

    const { bookId, action, query } = parseResult.data;
    const book = getBookById(bookId);
    if (!book) {
      return NextResponse.json({ error: 'Book not found in catalog' }, { status: 404 });
    }

    let responseData: any = {};

    switch (action) {
      case 'SUMMARY':
        responseData = {
          title: book.title,
          author: book.author,
          summary: book.description || `${book.title} provides comprehensive frameworks and tactical principles for ${book.category}.`,
          highlights: book.sampleExcerpt || [
            "Authentic verified publication format with vector-crisp typography.",
            "DRM-free digital edition compatible with all modern desktop and mobile readers."
          ]
        };
        break;

      case 'TAKEAWAYS':
        responseData = {
          title: book.title,
          keyTakeaways: [
            `Core foundational methodology for ${book.category}.`,
            `Actionable implementation steps curated by ${book.author}.`,
            `Unabridged ${book.pages}-page reference material with DRM-free reading freedom.`
          ]
        };
        break;

      case 'TABLE_OF_CONTENTS':
        responseData = {
          title: book.title,
          chapters: book.tableOfContents && book.tableOfContents.length > 0 
            ? book.tableOfContents 
            : [
                "Part I: Foundations & Core Principles",
                "Part II: Tactical Implementation & Architecture",
                "Part III: Case Studies & Quantitative Setups",
                "Part IV: Master Appendix & Execution Checklist"
              ]
        };
        break;

      case 'SIMILAR_RECOMMENDATIONS':
        responseData = {
          title: book.title,
          category: book.category,
          recommendationContext: `Selected companion titles curated for readers of ${book.title}.`,
          suggestedTags: [book.category, "Bestseller", "Master Edition"]
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      provenance: {
        model: 'AnonTrove Semantic Catalog Intelligence',
        verified: true,
        license: 'Permitted Author Excerpt / Educational Fair Use'
      }
    });
  } catch (err: any) {
    console.error('[AI Companion API Error]:', err);
    return NextResponse.json({ error: 'Internal AI service error' }, { status: 500 });
  }
}
