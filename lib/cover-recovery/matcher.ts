import type { BookIdentity, CoverCandidate, CoverConfidence } from './types';

function norm(s?: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function digits(s?: string): string {
  return (s || '').replace(/\D/g, '');
}

export function scoreCandidate(book: BookIdentity, candidate: CoverCandidate): CoverCandidate {
  const bookIsbn13 = digits(book.isbn13);
  const bookIsbn10 = digits(book.isbn10);
  const candIsbn13 = digits(candidate.isbn13);
  const candIsbn10 = digits(candidate.isbn10);

  if (bookIsbn13 && candIsbn13 && bookIsbn13 === candIsbn13) {
    return { ...candidate, confidence: 'HIGH', reason: 'exact ISBN-13 match' };
  }
  if (bookIsbn10 && candIsbn10 && bookIsbn10 === candIsbn10) {
    return { ...candidate, confidence: 'HIGH', reason: 'exact ISBN-10 match' };
  }
  if (
    (bookIsbn13 && candIsbn13 && bookIsbn13 !== candIsbn13) ||
    (bookIsbn10 && candIsbn10 && bookIsbn10 !== candIsbn10)
  ) {
    return { ...candidate, confidence: 'LOW', reason: 'conflicting ISBN' };
  }

  const titleBook = norm(book.title).split(':')[0].trim();
  const titleCand = norm(candidate.title).split(':')[0].trim();
  const authorBook = norm(book.author).split(',')[0].trim();
  const authorsCand = (candidate.authors || []).map(norm).join(' ');

  const titleExact = titleBook.length >= 4 && titleCand === titleBook;
  const titleContains =
    titleBook.length >= 6 &&
    (titleCand.includes(titleBook) || titleBook.includes(titleCand));
  const authorHit =
    authorBook.length >= 3 &&
    authorsCand.length > 0 &&
    authorBook.split(' ').filter((w) => w.length > 2).every((w) => authorsCand.includes(w));

  let confidence: CoverConfidence = 'LOW';
  let reason = 'weak metadata overlap';

  if (titleExact && authorHit) {
    confidence = 'HIGH';
    reason = 'exact title + author';
  } else if (titleExact) {
    confidence = 'MEDIUM';
    reason = 'exact title, author unverified';
  } else if (titleContains && authorHit) {
    confidence = 'MEDIUM';
    reason = 'fuzzy title + author';
  } else if (titleContains) {
    confidence = 'LOW';
    reason = 'title-only fuzzy match';
  }

  return { ...candidate, confidence, reason };
}

export function pickBestCandidate(candidates: CoverCandidate[]): CoverCandidate | undefined {
  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const sorted = [...candidates].sort((a, b) => rank[b.confidence] - rank[a.confidence]);
  const best = sorted[0];
  if (!best) return undefined;
  if (best.confidence === 'LOW') return undefined;
  return best;
}
