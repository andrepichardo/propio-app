/**
 * Storage abstraction. The rest of the app depends only on this interface, so
 * swapping Supabase Storage for S3/R2/GCS later is a single-file change.
 */
export type UploadInput = {
  /** Destination path within the bucket, e.g. `properties/<id>/cover.jpg`. */
  key: string;
  body: ArrayBuffer | Buffer | Uint8Array | Blob;
  contentType?: string;
  /** Cache-Control seconds for CDN caching of public assets. */
  cacheControlSeconds?: number;
  upsert?: boolean;
};

export type UploadResult = {
  key: string;
  url: string;
};

export type SignedUrlOptions = {
  /** Expiry in seconds for a temporary download URL. */
  expiresInSeconds?: number;
};

export interface StorageService {
  upload(input: UploadInput): Promise<UploadResult>;
  remove(keys: string | string[]): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}
