import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';
import { AppError } from '@/shared/lib/errors';
import type {
  SignedUrlOptions,
  StorageService,
  UploadInput,
  UploadResult,
} from './storage.types';

/**
 * Supabase Storage implementation of {@link StorageService}.
 *
 * Uses the service-role key, so this module is server-only. It is never
 * imported directly by feature code — only through the storage factory — which
 * keeps the swap boundary clean.
 */
export class SupabaseStorageService implements StorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor() {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError(
        'Supabase storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
        'STORAGE_NOT_CONFIGURED',
        500,
      );
    }
    this.client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    this.bucket = env.SUPABASE_STORAGE_BUCKET;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(input.key, input.body, {
        contentType: input.contentType,
        cacheControl: String(input.cacheControlSeconds ?? 3600),
        upsert: input.upsert ?? true,
      });

    if (error || !data) {
      throw new AppError(
        `Failed to upload file: ${error?.message ?? 'unknown error'}`,
        'STORAGE_UPLOAD_FAILED',
        500,
      );
    }

    return { key: data.path, url: this.getPublicUrl(data.path) };
  }

  async remove(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length === 0) return;
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove(list);
    if (error) {
      throw new AppError(
        `Failed to delete file(s): ${error.message}`,
        'STORAGE_DELETE_FAILED',
        500,
      );
    }
  }

  getPublicUrl(key: string): string {
    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(key);
    return data.publicUrl;
  }

  async getSignedUrl(
    key: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, options?.expiresInSeconds ?? 3600);
    if (error || !data) {
      throw new AppError(
        `Failed to sign URL: ${error?.message ?? 'unknown error'}`,
        'STORAGE_SIGN_FAILED',
        500,
      );
    }
    return data.signedUrl;
  }
}
