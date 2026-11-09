/**
 * Internet Archive API Provider
 * Connects to Internet Archive Texts & Bibliographic Records API
 * Official docs: https://archive.org/developers/
 */

export interface ArchiveRawDoc {
  identifier: string;
  title: string;
  creator?: string | string[];
  description?: string;
  year?: string | number;
  downloads?: number;
  item_size?: number;
  mediatype?: string;
}

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const IMG_BASE = 'https://archive.org/services/img';

export class InternetArchiveProvider {
  /**
   * Searches Internet Archive for published books by subject
   */
  static async searchSubjectBooks(subject: string, limit = 20): Promise<ArchiveRawDoc[]> {
    const formattedSubject = subject.toLowerCase().replace(/_/g, ' ');
    const query = `mediatype:texts AND subject:("${formattedSubject}") AND format:("Text PDF" OR "EPUB")`;

    const params = new URLSearchParams({
      q: query,
      fl: 'identifier,title,creator,description,year,downloads,item_size',
      sort: 'downloads desc',
      rows: String(limit),
      output: 'json'
    });

    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        headers: { 'User-Agent': 'AnonTroveBookDiscoveryBot/1.0' },
        next: { revalidate: 86400 }
      });

      if (!res.ok) throw new Error(`Internet Archive HTTP ${res.status}`);
      const data = await res.json();
      return data.response?.docs || [];
    } catch (err: any) {
      console.warn(`[InternetArchiveProvider] Search subject "${subject}" error:`, err.message);
      return [];
    }
  }

  /**
   * Generates direct high-resolution cover preview from Internet Archive service
   */
  static getCoverUrl(identifier: string): string {
    return `${IMG_BASE}/${encodeURIComponent(identifier)}`;
  }
}
