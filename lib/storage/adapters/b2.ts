import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl as generateS3PresignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';
import type { IStorageAdapter, StorageConfig, StorageObjectMetadata, StorageUsage, UploadResult } from '../types';

export class BackblazeB2Adapter implements IStorageAdapter {
  readonly provider = 'b2' as const;
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly defaultExpiry: number;

  constructor(config?: StorageConfig) {
    const endpoint = config?.endpoint || process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = config?.region || process.env.B2_REGION || 'us-east-005';
    this.bucket = config?.bucket || process.env.B2_BUCKET_NAME || 'anontrove-private-vault';
    this.defaultExpiry = config?.signExpirySeconds || parseInt(process.env.STORAGE_SIGN_EXPIRY_SECONDS || '900', 10);

    const accessKeyId = config?.keyId || process.env.B2_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = config?.applicationKey || process.env.B2_APPLICATION_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Backblaze B2 S3 compatibility requires path style
      forcePathStyle: true,
    });
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const cleanKey = key.replace(/^\/+/, '');
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    const response = await this.s3.send(command);

    return {
      key: cleanKey,
      size: buffer.length,
      etag: response.ETag?.replace(/"/g, ''),
      provider: 'b2',
    };
  }

  async download(key: string): Promise<{
    stream: NodeJS.ReadableStream | Readable;
    mimeType: string;
    size: number;
  }> {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    const response = await this.s3.send(command);
    if (!response.Body) {
      throw new Error(`Empty body returned for object: ${cleanKey}`);
    }

    return {
      stream: response.Body as unknown as Readable,
      mimeType: response.ContentType || 'application/octet-stream',
      size: response.ContentLength || 0,
    };
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds: number = this.defaultExpiry,
    downloadFilename?: string
  ): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');

    const disposition = downloadFilename
      ? `attachment; filename="${encodeURIComponent(downloadFilename)}"`
      : 'attachment';

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      ResponseContentDisposition: disposition,
    });

    return await generateS3PresignedUrl(this.s3, command, {
      expiresIn: Math.min(expiresInSeconds, 86400), // Max 24 hours
    });
  }

  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    await this.s3.send(command);
  }

  async getMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const cleanKey = key.replace(/^\/+/, '');
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      const res = await this.s3.send(command);
      return {
        key: cleanKey,
        size: res.ContentLength || 0,
        lastModified: res.LastModified,
        mimeType: res.ContentType,
        etag: res.ETag?.replace(/"/g, ''),
        customMetadata: res.Metadata,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getChecksum(key: string): Promise<string | null> {
    const meta = await this.getMetadata(key);
    return meta?.etag || null;
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1,
      });
      await this.s3.send(command);
      return { ok: true, message: `Connected to Backblaze B2 bucket: ${this.bucket}` };
    } catch (err: any) {
      return { ok: false, message: `B2 connection failed: ${err.message}` };
    }
  }

  async getStorageUsage(): Promise<StorageUsage> {
    let totalBytes = 0;
    let objectCount = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        ContinuationToken: continuationToken,
      });
      const response = await this.s3.send(command);
      if (response.Contents) {
        for (const item of response.Contents) {
          totalBytes += item.Size || 0;
          objectCount++;
        }
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return {
      totalBytes,
      objectCount,
      provider: 'b2',
      bucket: this.bucket,
    };
  }
}
