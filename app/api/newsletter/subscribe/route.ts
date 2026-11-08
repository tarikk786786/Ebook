import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const SubscribeSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  consent: z.boolean().refine(val => val === true, { message: 'Marketing consent is required' }),
  source: z.string().optional().default('homepage_footer')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || 'Validation failed';
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const subscribersFile = path.join(dataDir, 'subscribers.json');
    let subscribers: Array<{ email: string; subscribedAt: string; source: string }> = [];

    if (fs.existsSync(subscribersFile)) {
      try {
        subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
      } catch {
        subscribers = [];
      }
    }

    const existing = subscribers.find(s => s.email === email);
    if (!existing) {
      subscribers.push({
        email,
        subscribedAt: new Date().toISOString(),
        source: parsed.data.source
      });
      fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for joining AnonTrove. Your free primer is ready for reading.',
      freeSample: {
        title: 'Software Engineering Principles & System Architecture Primer',
        downloadUrl: '/library',
        format: 'PDF',
        pages: 42
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Subscription failed. Please try again.' },
      { status: 500 }
    );
  }
}
