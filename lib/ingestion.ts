import fs from 'fs';
import path from 'path';
import { Book } from '@/lib/catalog';

export interface IngestionJob {
  id: string;
  source: string;
  totalItems: number;
  processedItems: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface IngestionSource {
  id: string;
  channelId: number;
  title: string;
  username?: string;
  accessStatus: 'accessible' | 'private_restricted' | 'invalid' | 'flood_wait';
  totalDiscovered: number;
  lastScanned?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const REGISTRY_FILE = path.join(DATA_DIR, 'books_registry.json');
const JOBS_FILE = path.join(DATA_DIR, 'ingestion_jobs.json');
const SOURCES_FILE = path.join(DATA_DIR, 'ingestion_sources.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getRegistry(): Book[] {
  ensureDataDir();
  if (fs.existsSync(REGISTRY_FILE)) {
    try {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading books_registry.json:', e);
    }
  }
  return [];
}

export function saveRegistry(books: Book[]): void {
  ensureDataDir();
  const tmpFile = `${REGISTRY_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(books, null, 2), 'utf-8');
  fs.renameSync(tmpFile, REGISTRY_FILE);
}

export function getIngestionJobs(): IngestionJob[] {
  ensureDataDir();
  if (fs.existsSync(JOBS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
    } catch (e) {}
  }
  return [
    {
      id: 'job-latest-harvest',
      source: 'Telegram Dual-Account Harvester',
      totalItems: 300,
      processedItems: 300,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
    }
  ];
}

export function saveIngestionJobs(jobs: IngestionJob[]): void {
  ensureDataDir();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

export function getIngestionSources(): IngestionSource[] {
  ensureDataDir();
  if (fs.existsSync(SOURCES_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
    } catch (e) {}
  }
  return [
    { id: 'src-1', channelId: -1001402129133, title: 'Non Fiction business ebooks', username: 'nonfictionbusinessebooks', accessStatus: 'accessible', totalDiscovered: 6181, lastScanned: new Date().toISOString() },
    { id: 'src-2', channelId: -1001414859869, title: 'Non Fiction Ebook (Linked)', accessStatus: 'accessible', totalDiscovered: 2354, lastScanned: new Date().toISOString() },
    { id: 'src-3', channelId: -1001597462576, title: '●๋ 𝗘𝗕𝗢𝗢𝗞𝗦𝗜𝗡𝗗 हिन्दी ●๋', username: 'EBOOKSIND_HINDI', accessStatus: 'accessible', totalDiscovered: 2065, lastScanned: new Date().toISOString() },
    { id: 'src-4', channelId: -1001643479674, title: 'Psychology books', username: 'bookspsychology101', accessStatus: 'accessible', totalDiscovered: 1000, lastScanned: new Date().toISOString() },
    { id: 'src-5', channelId: -1002022608693, title: 'Self Help books', username: 'SelfHelpbooks11', accessStatus: 'accessible', totalDiscovered: 1200, lastScanned: new Date().toISOString() },
    { id: 'src-6', channelId: -1001434214441, title: 'BookZillaaa - FREE eBooks', username: 'bookzillaaa', accessStatus: 'accessible', totalDiscovered: 2500, lastScanned: new Date().toISOString() },
    { id: 'src-7', channelId: -1002306936155, title: 'CD (E- Library)', accessStatus: 'accessible', totalDiscovered: 2016, lastScanned: new Date().toISOString() },
  ];
}
