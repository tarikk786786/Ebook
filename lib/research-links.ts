export interface BookResearchIdentity {
  title: string;
  author?: string | null;
  isbn?: string | null;
}

export interface BookResearchLinks {
  googleBooks: string;
  openLibrary: string;
  crossref: string;
  googleImages: string;
  bingImages: string;
  wikimedia: string;
  europeana: string;
  authorResearchGoogle: string;
  wikipedia: string;
  wikidata: string;
  internetArchive: string;
  gutenberg: string;
  standardEbooks: string;
  doab: string;
  oapen: string;
  worldcat: string;
  loc: string;
  hathitrust: string;
  britishLibrary: string;
  dnb: string;
  googleScholar: string;
  openAlex: string;
  semanticScholar: string;
  core: string;
  amazon: string;
  googlePlay: string;
  publisherOfficial: string;
  authorOfficial: string;
}

/**
 * Builds broad, book-specific discovery links across international catalogues,
 * libraries, scholarly indexes, open-access collections, image search and stores.
 *
 * These are search/discovery links, not proof that a result is the same edition,
 * that an image is authentic, or that a file may legally be redistributed.
 */
export function buildBookResearchLinks({
  title,
  author,
  isbn,
}: BookResearchIdentity): BookResearchLinks {
  const safeTitle = (title || "").trim();
  const safeAuthor = (author || "").trim();
  const safeIsbn = (isbn || "").replace(/[^0-9Xx]/g, "");
  const combinedQuery = [safeTitle, safeAuthor].filter(Boolean).join(" ");
  const q = encodeURIComponent(combinedQuery);
  const titleQ = encodeURIComponent(safeTitle);
  const isbnQ = encodeURIComponent(safeIsbn);
  const coverQuery = encodeURIComponent(`${combinedQuery} book cover edition`);
  const authorQuery = encodeURIComponent(safeAuthor || safeTitle);
  const authorResearchQuery = encodeURIComponent(
    `${safeAuthor || safeTitle} author biography official`
  );
  const publisherQuery = encodeURIComponent(`${combinedQuery} publisher official`);
  const googleSearch = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const isbnOrTitle = safeIsbn ? `ISBN ${safeIsbn}` : safeTitle;

  return {
    googleBooks: safeIsbn
      ? `https://books.google.com/books?vid=ISBN${isbnQ}`
      : `https://books.google.com/books?q=${q}`,
    openLibrary: safeIsbn
      ? `https://openlibrary.org/isbn/${isbnQ}`
      : `https://openlibrary.org/search?q=${q}`,
    crossref: `https://api.crossref.org/works?query.bibliographic=${q}&rows=10`,
    googleImages: `https://www.google.com/search?tbm=isch&q=${coverQuery}`,
    bingImages: `https://www.bing.com/images/search?q=${coverQuery}`,
    wikimedia: `https://commons.wikimedia.org/w/index.php?search=${coverQuery}&title=Special:MediaSearch&type=image`,
    europeana: `https://www.europeana.eu/en/search?query=${q}`,
    authorResearchGoogle: googleSearch(authorResearchQuery),
    wikipedia: `https://en.wikipedia.org/w/index.php?search=${authorQuery}`,
    wikidata: `https://www.wikidata.org/w/index.php?search=${authorQuery}`,
    internetArchive: `https://archive.org/search?query=${q}`,
    gutenberg: `https://www.gutenberg.org/ebooks/search/?query=${titleQ}`,
    standardEbooks: `https://standardebooks.org/ebooks?query=${titleQ}`,
    doab: `https://www.doabooks.org/en/search?query=${q}`,
    oapen: `https://www.oapen.org/search?keyword=${q}`,
    worldcat: `https://search.worldcat.org/search?q=${encodeURIComponent(isbnOrTitle)}`,
    loc: `https://www.loc.gov/books/?q=${q}&fo=json`,
    hathitrust: `https://catalog.hathitrust.org/Search/Home?lookfor=${q}&searchtype=all`,
    britishLibrary: googleSearch(`site:bl.uk ${combinedQuery}`),
    dnb: `https://portal.dnb.de/opac/simpleSearch?query=${q}`,
    googleScholar: `https://scholar.google.com/scholar?q=${q}`,
    openAlex: `https://openalex.org/works?search=${q}`,
    semanticScholar: `https://www.semanticscholar.org/search?q=${q}`,
    core: `https://core.ac.uk/search?q=${q}`,
    amazon: `https://www.amazon.in/s?k=${q}`,
    googlePlay: `https://play.google.com/store/search?q=${q}&c=books`,
    publisherOfficial: googleSearch(publisherQuery),
    authorOfficial: googleSearch(`${safeAuthor || safeTitle} official website`),
  };
}

/** Hosts allowed when rendering externally supplied research links. */
const ALLOWED_RESEARCH_HOSTS = new Set([
  "books.google.com",
  "openlibrary.org",
  "api.crossref.org",
  "www.google.com",
  "www.bing.com",
  "commons.wikimedia.org",
  "www.europeana.eu",
  "en.wikipedia.org",
  "www.wikidata.org",
  "archive.org",
  "www.gutenberg.org",
  "standardebooks.org",
  "www.doabooks.org",
  "www.oapen.org",
  "search.worldcat.org",
  "www.loc.gov",
  "catalog.hathitrust.org",
  "www.bl.uk",
  "portal.dnb.de",
  "scholar.google.com",
  "openalex.org",
  "www.semanticscholar.org",
  "core.ac.uk",
  "www.amazon.in",
  "play.google.com",
]);

export function isSafeResearchUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ALLOWED_RESEARCH_HOSTS.has(url.hostname.toLowerCase()) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
