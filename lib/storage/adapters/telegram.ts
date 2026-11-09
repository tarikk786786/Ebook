import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import type { 
  IStorageAdapter, 
  StorageObjectMetadata, 
  StorageUsage, 
  UploadResult 
} from '../types';
import { LocalStorageAdapter } from './local';

export interface TelegramStorageConfig {
  botToken?: string;
  storageChannelId?: string;
  apiBaseUrl?: string;
}

/**
 * Telegram Cloud Storage Adapter
 * Implements IStorageAdapter by leveraging Telegram Bot API & Private Storage Channels
 * as high-availability, zero-cost digital vault storage, with seamless zero-trace proxying.
 */
export class TelegramStorageAdapter implements IStorageAdapter {
  readonly provider = 'telegram' as const;
  private readonly botToken: string;
  private readonly channelId: string;
  private readonly apiBaseUrl: string;
  private readonly localFallback: LocalStorageAdapter;
  private readonly indexFilePath: string;

  constructor(config?: TelegramStorageConfig) {
    this.botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.channelId = config?.storageChannelId || process.env.TELEGRAM_STORAGE_CHANNEL_ID || '@coding_with_ujjwal';
    this.apiBaseUrl = config?.apiBaseUrl || 'https://api.telegram.org';
    this.localFallback = new LocalStorageAdapter();
    this.indexFilePath = path.resolve(process.cwd(), 'data', 'telegram_storage_index.json');
  }

  /**
   * Reads the mapping of storage keys / book slugs to Telegram File IDs or message links.
   */
  private getIndex(): Record<string, { fileId: string; messageId?: number; size?: number; mimeType?: string; sha256?: string }> {
    try {
      if (fs.existsSync(this.indexFilePath)) {
        return JSON.parse(fs.readFileSync(this.indexFilePath, 'utf8'));
      }
    } catch {}
    return {};
  }

  /**
   * Persists an entry to the Telegram storage index.
   */
  private saveIndexEntry(key: string, data: { fileId: string; messageId?: number; size?: number; mimeType?: string; sha256?: string }) {
    try {
      const dir = path.dirname(this.indexFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const current = this.getIndex();
      current[key] = data;
      fs.writeFileSync(this.indexFilePath, JSON.stringify(current, null, 2), 'utf8');
    } catch (err) {
      console.error('[TelegramStorageAdapter] Failed to update storage index:', err);
    }
  }

  /**
   * Upload an eBook document to the designated private storage channel via Telegram Bot API.
   */
  async upload(
    key: string,
    data: Buffer | Uint8Array,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // If bot token is configured, push document to private storage channel
    if (this.botToken) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
        formData.append('chat_id', this.channelId);
        formData.append('document', blob, key);
        if (metadata?.title) {
          formData.append('caption', `Vault Asset: ${metadata.title}\nSHA256: ${hash}`);
        }

        const res = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendDocument`, {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (json.ok && json.result?.document?.file_id) {
          const fileId = json.result.document.file_id;
          const messageId = json.result.message_id;

          this.saveIndexEntry(key, {
            fileId,
            messageId,
            size: buffer.length,
            mimeType,
            sha256: hash,
          });

          return {
            key,
            size: buffer.length,
            sha256: hash,
            provider: 'telegram',
            url: `tg://${this.channelId}/${messageId}`,
          };
        }
      } catch (err) {
        console.warn('[TelegramStorageAdapter] Remote upload failed, writing to local fallback:', err);
      }
    }

    // Fallback: Store locally
    return this.localFallback.upload(key, data, mimeType, metadata);
  }

  /**
   * Stream eBook directly through Vercel Functions for zero-trace customer delivery.
   */
  async download(key: string): Promise<{
    stream: NodeJS.ReadableStream | Readable;
    mimeType: string;
    size: number;
  }> {
    const index = this.getIndex();
    const entry = index[key];

    if (entry?.fileId && this.botToken) {
      try {
        const fileInfoRes = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/getFile?file_id=${entry.fileId}`);
        const fileInfo = await fileInfoRes.json();

        if (fileInfo.ok && fileInfo.result?.file_path) {
          const downloadUrl = `${this.apiBaseUrl}/file/bot${this.botToken}/${fileInfo.result.file_path}`;
          const fileRes = await fetch(downloadUrl);

          if (fileRes.ok && fileRes.body) {
            const stream = Readable.fromWeb(fileRes.body as any);
            return {
              stream,
              mimeType: entry.mimeType || 'application/pdf',
              size: entry.size || Number(fileRes.headers.get('content-length')) || 0,
            };
          }
        }
      } catch (err) {
        console.warn('[TelegramStorageAdapter] Remote streaming error, attempting fallback:', err);
      }
    }

    // Fallback to local storage
    return this.localFallback.download(key);
  }

  /**
   * Generates a single-use, time-decayed signed download URL (max 15 mins TTL)
   * pointing to the Vercel download proxy endpoint.
   */
  async getSignedUrl(
    key: string,
    expiresInSeconds: number = 900,
    downloadFilename?: string
  ): Promise<string> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ebook-sandy-chi.vercel.app';
    const expiresAt = Math.floor(Date.now() / 1000) + Math.min(expiresInSeconds, 900);
    const secret = process.env.STORAGE_SIGN_SECRET || process.env.DOWNLOAD_ENCRYPTION_SECRET || 'anontrove_ephemeral_signing_secret_2026';

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${key}:${expiresAt}`)
      .digest('hex');

    const token = Buffer.from(
      JSON.stringify({
        key,
        exp: expiresAt,
        sig: hmac,
        fn: downloadFilename || path.basename(key),
      })
    ).toString('base64url');

    return `${siteUrl}/api/download/${token}`;
  }

  /**
   * Deletes an eBook reference from the index and local fallback.
   */
  async delete(key: string): Promise<void> {
    const index = this.getIndex();
    if (index[key]) {
      delete index[key];
      try {
        fs.writeFileSync(this.indexFilePath, JSON.stringify(index, null, 2), 'utf8');
      } catch {}
    }
    await this.localFallback.delete(key);
  }

  /**
   * Retrieves object metadata.
   */
  async getMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const index = this.getIndex();
    const entry = index[key];
    if (entry) {
      return {
        key,
        size: entry.size || 0,
        mimeType: entry.mimeType || 'application/pdf',
        lastModified: new Date(),
        sha256: entry.sha256,
      };
    }
    return this.localFallback.getMetadata(key);
  }

  /**
   * Retrieves or computes SHA-256 checksum.
   */
  async getChecksum(key: string): Promise<string | null> {
    const meta = await this.getMetadata(key);
    return meta?.sha256 || null;
  }

  /**
   * Verifies credentials and connectivity to the storage backend.
   */
  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    if (this.botToken) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/getMe`);
        const json = await res.json();
        if (json.ok) {
          return { ok: true, message: `Connected to Telegram Bot: @${json.result.username}` };
        }
      } catch (err: any) {
        return { ok: false, message: `Telegram Bot connection failed: ${err.message}` };
      }
    }
    return { ok: true, message: 'TelegramStorageAdapter active with local fallback storage vault.' };
  }

  /**
   * Calculates overall storage telemetry.
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const index = this.getIndex();
    const keys = Object.keys(index);
    let totalBytes = 0;
    for (const k of keys) {
      totalBytes += index[k].size || 0;
    }

    const localUsage = await this.localFallback.getStorageUsage();

    return {
      totalBytes: totalBytes + localUsage.totalBytes,
      objectCount: keys.length + localUsage.objectCount,
      provider: 'telegram',
      bucket: this.channelId,
    };
  }
}
