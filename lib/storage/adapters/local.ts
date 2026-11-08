import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import type { IStorageAdapter, StorageObjectMetadata, StorageUsage, UploadResult } from '../types';

export class LocalStorageAdapter implements IStorageAdapter {
  readonly provider = 'local' as const;
  private readonly baseDir: string;
  private readonly signSecret: string;

  constructor(baseDir?: string, signSecret?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), 'private_storage');
    const secret = signSecret || process.env.STORAGE_SIGN_SECRET || process.env.DOWNLOAD_ENCRYPTION_SECRET;
    if (!secret || secret.trim().length < 32) {
      throw new Error('[FATAL SECURITY] STORAGE_SIGN_SECRET or DOWNLOAD_ENCRYPTION_SECRET must be configured (min 32 characters) for LocalStorageAdapter.');
    }
    this.signSecret = secret.trim();
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        console.warn(`[LocalStorageAdapter] Warning: Could not create baseDir: ${this.baseDir}`, err);
      }
    }
  }

  private resolvePath(key: string): string {
    const cleanKey = key.replace(/^(\.\.(\/|\\|$))+/, '').replace(/[/\\]+/g, path.sep);
    const resolved = path.resolve(this.baseDir, cleanKey);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error(`Path traversal attempt detected: ${key}`);
    }
    return resolved;
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const targetPath = this.resolvePath(key);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await fs.promises.writeFile(targetPath, buffer);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Optionally save sidecar metadata
    if (metadata && Object.keys(metadata).length > 0) {
      try {
        await fs.promises.writeFile(
          `${targetPath}.meta.json`,
          JSON.stringify({ ...metadata, mimeType, sha256: hash, uploadedAt: new Date().toISOString() }, null, 2),
          'utf8'
        );
      } catch {
        // Non-blocking
      }
    }

    return {
      key,
      size: buffer.length,
      sha256: hash,
      provider: 'local',
      url: `/api/download/local?key=${encodeURIComponent(key)}`
    };
  }

  async download(key: string): Promise<{
    stream: NodeJS.ReadableStream | Readable;
    mimeType: string;
    size: number;
  }> {
    const targetPath = this.resolvePath(key);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found: ${key}`);
    }

    const stat = await fs.promises.stat(targetPath);
    const stream = fs.createReadStream(targetPath);
    const mimeType = this.inferMimeType(key);

    return {
      stream,
      mimeType,
      size: stat.size
    };
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds: number = 900,
    downloadFilename?: string
  ): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expiresAt}:${downloadFilename || ''}`;
    const hmac = crypto.createHmac('sha256', this.signSecret).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ key, expiresAt, fn: downloadFilename, sig: hmac })).toString('base64url');

    return `/api/download/stream?token=${token}`;
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolvePath(key);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
    const metaPath = `${targetPath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath).catch(() => {});
    }
  }

  async getMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const targetPath = this.resolvePath(key);
    if (!fs.existsSync(targetPath)) {
      return null;
    }

    const stat = await fs.promises.stat(targetPath);
    let customMetadata: Record<string, string> | undefined;

    const metaPath = `${targetPath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      try {
        const raw = await fs.promises.readFile(metaPath, 'utf8');
        customMetadata = JSON.parse(raw);
      } catch {
        // Ignore
      }
    }

    return {
      key,
      size: stat.size,
      lastModified: stat.mtime,
      mimeType: this.inferMimeType(key),
      customMetadata
    };
  }

  async getChecksum(key: string): Promise<string | null> {
    const targetPath = this.resolvePath(key);
    if (!fs.existsSync(targetPath)) return null;

    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(targetPath);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      const testFile = path.join(this.baseDir, '.connection_probe');
      fs.writeFileSync(testFile, 'probe_ok', 'utf8');
      fs.unlinkSync(testFile);
      return { ok: true, message: `Local directory writable: ${this.baseDir}` };
    } catch (err: any) {
      return { ok: false, message: `Local directory error: ${err.message}` };
    }
  }

  async getStorageUsage(): Promise<StorageUsage> {
    let totalBytes = 0;
    let objectCount = 0;

    const walk = async (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile() && !entry.name.endsWith('.meta.json') && !entry.name.startsWith('.')) {
          objectCount++;
          const stat = await fs.promises.stat(full);
          totalBytes += stat.size;
        }
      }
    };

    await walk(this.baseDir);
    return {
      totalBytes,
      objectCount,
      provider: 'local'
    };
  }

  private inferMimeType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    switch (ext) {
      case '.pdf': return 'application/pdf';
      case '.epub': return 'application/epub+zip';
      case '.mobi': return 'application/x-mobipocket-ebook';
      case '.cbz': return 'application/vnd.comicbook+zip';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.jpg':
      case '.jpeg': return 'image/jpeg';
      case '.png': return 'image/png';
      case '.webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }
}
