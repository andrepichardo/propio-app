import 'server-only';
import { SupabaseStorageService } from './supabase-storage';
import type { StorageService } from './storage.types';

export type { StorageService } from './storage.types';

/**
 * Storage factory (a tiny service locator). Feature code calls
 * `getStorage()` and depends only on the {@link StorageService} interface, so
 * the concrete driver can be swapped by editing this one function.
 */
let instance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!instance) {
    instance = new SupabaseStorageService();
  }
  return instance;
}

/** Test seam: inject a fake storage implementation. */
export function setStorage(service: StorageService): void {
  instance = service;
}
