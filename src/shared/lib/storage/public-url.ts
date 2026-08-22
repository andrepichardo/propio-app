/**
 * Recover a storage key from a Supabase public URL.
 *
 * Some blobs are stored under a random UUID and only the public URL is
 * persisted on the row, so deleting one means parsing the key back out of
 * `.../object/public/{bucket}/{key}`. Used by the permanent delete of a
 * payment, where getting this wrong means either an orphaned blob or — worse —
 * deleting somebody else's.
 *
 * Returns null for anything that is not a recognisable public URL, so callers
 * skip the delete instead of guessing a key.
 */
export function storageKeyFromPublicUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = '/object/public/';
  const at = url.indexOf(marker);
  if (at === -1) return null;
  // Drop the `?v=` cache-buster we append when re-uploading to a fixed key.
  const afterBucket = url.slice(at + marker.length).split('?')[0] ?? '';
  const slash = afterBucket.indexOf('/');
  if (slash === -1) return null;
  return decodeURIComponent(afterBucket.slice(slash + 1));
}
