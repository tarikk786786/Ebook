/**
 * Bulletproof Site URL Resolver
 * Guarantees a valid, parseable absolute URL with https:// protocol.
 * Prevents Vercel SSG crashes caused by malformed NEXT_PUBLIC_SITE_URL or VERCEL_URL.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL,
    'https://ebook-sandy-chi.vercel.app',
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;

    // If protocol already included
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const u = new URL(trimmed);
        return u.origin;
      } catch {
        continue;
      }
    }

    // Try prepending https://
    try {
      const u = new URL(`https://${trimmed}`);
      return u.origin;
    } catch {
      continue;
    }
  }

  return 'https://ebook-sandy-chi.vercel.app';
}

export function getSiteMetadataBase(): URL {
  return new URL(getSiteUrl());
}
