export interface BookResearchIdentity {
  title: string;
  author?: string | null;
}

export interface BookResearchLinks {
  googleBooks: string;
  openLibrary: string;
  crossref: string;
  googleImages: string;
  wikimedia: string;
  authorResearchGoogle: string;
  wikipedia: string;
  internetArchive: string;
  gutenberg: string;
  amazon: string;
  googlePlay: string;
  publisherOfficial: string;
}

/**
 * Build discovery/search URLs for the current book identity.
 *
 * These are search queries, not verified bibliographic records, direct image
 * files, free-download links, market prices, or proof of redistribution rights.
 */
export function buildBookResearchLinks({
  title,
  author,
}: BookResearchIdentity): BookResearchLinks {
  const safeTitle = (title || "").trim();
  const safeAuthor = (author || "").trim();
  const combinedQuery = [safeTitle, safeAuthor].filter(Boolean).join(" ");
  const q = encodeURIComponent(combinedQuery);
  const coverQuery = encodeURIComponent(`${combinedQuery} book cover`);
  const authorQuery = encodeURIComponent(safeAuthor || safeTitle);
  const authorResearchQuery = encodeURIComponent(
    `${safeAuthor || safeTitle} author biography official`
  );
  const publisherQuery = encodeURIComponent(
    `${combinedQuery} publisher official`
  );

  return {
    googleBooks: `https://books.google.com/books?q=${q}`,
    openLibrary: `https://openlibrary.org/search?q=${q}`,
    crossref: `https://api.crossref.org/works?query.bibliographic=${q}&rows=5`,
    googleImages: `https://www.google.com/search?tbm=isch&q=${coverQuery}`,
    wikimedia: `https://commons.wikimedia.org/w/index.php?search=${coverQuery}&title=Special:MediaSearch&type=image`,
    authorResearchGoogle: `https://www.google.com/search?q=${authorResearchQuery}`,
    wikipedia: `https://en.wikipedia.org/w/index.php?search=${authorQuery}`,
    internetArchive: `https://archive.org/search?query=${q}`,
    gutenberg: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(safeTitle)}`,
    amazon: `https://www.amazon.in/s?k=${q}`,
    googlePlay: `https://play.google.com/store/search?q=${q}&c=books`,
    publisherOfficial: `https://www.google.com/search?q=${publisherQuery}`,
  };
}
