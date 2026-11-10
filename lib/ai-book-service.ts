import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import path from 'path';

const BookMetadataSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  subtitle: z.string().optional(),
  isbn13: z.string().optional(),
  isbn10: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  categories: z.array(z.string()).optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0),
});

const CoverCandidateSchema = z.object({
  source: z.enum(['openlibrary', 'googlebooks', 'local', 'synthetic']),
  imageUrl: z.string().url().or(z.string().startsWith('/')),
  confidence: z.number().min(0).max(1),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
});

export type BookMetadata = z.infer<typeof BookMetadataSchema>;
export type CoverCandidate = z.infer<typeof CoverCandidateSchema>;

export class AiNotConfiguredError extends Error {
  constructor(message = 'AI_GATEWAY_API_KEY is not configured') {
    super(message);
    this.name = 'AiNotConfiguredError';
  }
}

function requireAiGateway(): string {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) throw new AiNotConfiguredError();
  return key;
}

function getDb() {
  // Lazy require so Edge/client bundles never pull node:sqlite
  // Node 22+/24 built-in; types may be absent in local @types/node.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sqlite = require('node:sqlite') as { DatabaseSync: new (path: string) => any };
  const dbPath = path.resolve(process.cwd(), 'data', 'enrichment_86k_checkpoint.db');
  return new sqlite.DatabaseSync(dbPath);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
}

export function getAiConfigStatus() {
  return {
    aiGateway: isAiConfigured(),
    googleBooks: Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim()),
    metadataModel: process.env.BOOK_METADATA_MODEL || 'google/gemini-2.5-flash',
    visionModel: process.env.BOOK_VISION_MODEL || 'google/gemini-2.5-flash',
    dailyBudget: Number(process.env.BOOK_AI_MAX_DAILY_BUDGET || 500),
  };
}

/** Fail-closed stub until AI_GATEWAY_API_KEY is provisioned. */
export async function extractBookMetadata(input: {
  title: string;
  author?: string;
  textSample?: string;
}): Promise<BookMetadata> {
  requireAiGateway();
  // Real Vercel AI SDK call will land here once the gateway key exists.
  return BookMetadataSchema.parse({
    title: input.title,
    author: input.author,
    confidence: 0.1,
    description: 'AI metadata extraction placeholder — gateway configured but model call not yet wired.',
  });
}

export async function findCoverCandidates(input: {
  title: string;
  author?: string;
  isbn?: string;
}): Promise<CoverCandidate[]> {
  const candidates: CoverCandidate[] = [];

  if (input.isbn) {
    candidates.push(
      CoverCandidateSchema.parse({
        source: 'openlibrary',
        imageUrl: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(input.isbn)}-L.jpg`,
        confidence: 0.75,
        verified: false,
        notes: 'Open Library ISBN cover (requires visual review)',
      })
    );
  }

  // Local synthetic fallback path used by /api/covers
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  candidates.push(
    CoverCandidateSchema.parse({
      source: 'synthetic',
      imageUrl: `/api/covers/${slug || 'book'}`,
      confidence: 0.2,
      verified: false,
      notes: 'Synthetic SVG — label as Cover not verified on PDP',
    })
  );

  if (!isAiConfigured()) {
    return candidates;
  }

  // Gateway present: keep deterministic candidates until model wiring is added.
  return candidates;
}

export async function recommendSellingPrice(input: {
  pages?: number;
  category?: string;
  marketReferencePrice?: number;
}): Promise<{ recommendedInr: number; rationale: string }> {
  const pages = input.pages || 120;
  let base = 29;
  if (pages >= 300) base = 99;
  else if (pages >= 150) base = 49;
  else if (pages >= 80) base = 29;
  else base = 19;

  if (input.marketReferencePrice && input.marketReferencePrice > 0) {
    base = Math.max(9, Math.min(base, Math.round(input.marketReferencePrice * 0.15)));
  }

  return {
    recommendedInr: base,
    rationale: isAiConfigured()
      ? 'Heuristic price pending full AI pricing model'
      : 'Heuristic price (AI gateway not configured)',
  };
}

export function recordAiJobStub(jobType: string, bookId?: string, payload?: unknown) {
  try {
    const db = getDb();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO ai_jobs (id, book_id, job_type, status, payload_json) VALUES (?, ?, ?, 'queued', ?)`
    ).run(id, bookId || null, jobType, JSON.stringify(payload || {}));
    db.close();
    return id;
  } catch {
    return createHash('sha256').update(`${jobType}:${bookId}:${Date.now()}`).digest('hex').slice(0, 32);
  }
}

export function getAiTableCounts(): Record<string, number> {
  try {
    const db = getDb();
    const counts = {
      ai_jobs: Number(db.prepare('SELECT COUNT(*) AS c FROM ai_jobs').get()?.c || 0),
      ai_cover_candidates: Number(db.prepare('SELECT COUNT(*) AS c FROM ai_cover_candidates').get()?.c || 0),
      ai_usage_ledger: Number(db.prepare('SELECT COUNT(*) AS c FROM ai_usage_ledger').get()?.c || 0),
    };
    db.close();
    return counts;
  } catch {
    return { ai_jobs: -1, ai_cover_candidates: -1, ai_usage_ledger: -1 };
  }
}
