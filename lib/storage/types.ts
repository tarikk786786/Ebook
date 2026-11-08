import type { Readable } from 'stream';

export type StorageProviderType = 'b2' | 'local' | 's3' | 'r2';

export interface StorageConfig {
  provider: StorageProviderType;
  endpoint?: string;
  region?: string;
  bucket?: string;
  keyId?: string;
  applicationKey?: string;
  localStoragePath?: string;
  signExpirySeconds?: number;
}

export interface StorageObjectMetadata {
  key: string;
  size: number;
  lastModified?: Date;
  mimeType?: string;
  etag?: string;
  sha256?: string;
  customMetadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  size: number;
  etag?: string;
  sha256?: string;
  provider: StorageProviderType;
  url?: string;
}

export interface StorageUsage {
  totalBytes: number;
  objectCount: number;
  provider: StorageProviderType;
  bucket?: string;
}

export interface IStorageAdapter {
  readonly provider: StorageProviderType;

  /**
   * Upload an object into the storage vault
   */
  upload(
    key: string,
    data: Buffer | Uint8Array,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult>;

  /**
   * Download / stream an object directly (internal use / local fallback)
   */
  download(key: string): Promise<{
    stream: NodeJS.ReadableStream | Readable;
    mimeType: string;
    size: number;
  }>;

  /**
   * Generate an authenticated, time-limited pre-signed URL for client direct download (HTTP 307)
   */
  getSignedUrl(
    key: string,
    expiresInSeconds?: number,
    downloadFilename?: string
  ): Promise<string>;

  /**
   * Delete an object from the vault
   */
  delete(key: string): Promise<void>;

  /**
   * Retrieve metadata for an object
   */
  getMetadata(key: string): Promise<StorageObjectMetadata | null>;

  /**
   * Retrieve or compute SHA-256 checksum
   */
  getChecksum(key: string): Promise<string | null>;

  /**
   * Verify credentials and connectivity to the storage backend
   */
  testConnection(): Promise<{ ok: boolean; message?: string }>;

  /**
   * Get approximate storage usage and count
   */
  getStorageUsage(): Promise<StorageUsage>;
}
