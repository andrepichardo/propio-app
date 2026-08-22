import { describe, expect, it } from 'vitest';
import { storageKeyFromPublicUrl } from '@/shared/lib/storage/public-url';

const BASE = 'https://abc123.supabase.co/storage/v1/object/public/propio';

describe('storageKeyFromPublicUrl', () => {
  it('extracts the key after the bucket', () => {
    expect(storageKeyFromPublicUrl(`${BASE}/payments/owner-1/uuid.png`)).toBe(
      'payments/owner-1/uuid.png',
    );
  });

  it('strips the ?v= cache-buster', () => {
    // Fixed-key uploads (avatar, signature, receipt PDF) carry `?v=` so the
    // CDN re-fetches them; the storage key itself must not include it.
    expect(
      storageKeyFromPublicUrl(`${BASE}/signatures/owner-1?v=1755800000000`),
    ).toBe('signatures/owner-1');
  });

  it('decodes percent-encoded segments', () => {
    expect(storageKeyFromPublicUrl(`${BASE}/docs/contrato%20firmado.pdf`)).toBe(
      'docs/contrato firmado.pdf',
    );
  });

  it('handles a deep key', () => {
    expect(
      storageKeyFromPublicUrl(`${BASE}/receipts/owner-1/REC-2026-0001.pdf`),
    ).toBe('receipts/owner-1/REC-2026-0001.pdf');
  });

  it('returns null for empty input', () => {
    expect(storageKeyFromPublicUrl(null)).toBeNull();
    expect(storageKeyFromPublicUrl(undefined)).toBeNull();
    expect(storageKeyFromPublicUrl('')).toBeNull();
  });

  it('returns null for a URL that is not a public storage URL', () => {
    // Returning null makes the caller SKIP the delete. Guessing a key here
    // could delete an unrelated blob.
    expect(storageKeyFromPublicUrl('https://example.com/foo.png')).toBeNull();
    expect(
      storageKeyFromPublicUrl(
        'https://abc.supabase.co/storage/v1/object/sign/propio/x.png',
      ),
    ).toBeNull();
  });

  it('returns null when the bucket has no key after it', () => {
    expect(storageKeyFromPublicUrl(`${BASE}`)).toBeNull();
  });
});
