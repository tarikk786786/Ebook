/** Normalize title/author for duplicate ebook request detection. */

export function normalizeRequestMatchKey(title: string, author: string | null | undefined): {
  titleKey: string;
  authorKey: string;
} {
  const titleKey = normalizeTextFragment(title);
  const authorKey = normalizeTextFragment(author ?? '');
  return { titleKey, authorKey };
}

function normalizeTextFragment(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
