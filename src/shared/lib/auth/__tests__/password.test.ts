import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';

/**
 * bcryptjs was bumped 2.4 → 3.0 (4 sep 2026). The API is identical, so a type
 * check and a build both pass either way — but the only thing that actually
 * matters on a password library is whether the hashes ALREADY IN THE DATABASE
 * still verify. A regression there locks every existing user out silently.
 *
 * The first hash was produced by bcryptjs 2.4.3, the second is a real row from
 * the dev database; both encode the seed password. They are frozen literals on
 * purpose — regenerating them with the current version would test nothing.
 */
describe('password hashing across the bcryptjs 2 → 3 bump', () => {
  const PASSWORD = 'Demo1234!';
  const HASH_FROM_V2 =
    '$2a$12$EEk2xdhOWQtyCXPpj9hPl.3RbwntT86fvqtmidCxtg4ubwENmAsEa';
  const HASH_FROM_DEV_DB =
    '$2a$12$F3DXEbJD1n820qhQga/c9OvvODhS9BH2Yt7G7CYgalaf6RpcDOPfm';

  it('still verifies a hash written by bcryptjs 2.x', () => {
    expect(bcrypt.compareSync(PASSWORD, HASH_FROM_V2)).toBe(true);
  });

  it('still verifies a hash the running app stored', () => {
    // `$2a$` — the prefix every row predating the bump carries.
    expect(HASH_FROM_DEV_DB.startsWith('$2a$')).toBe(true);
    expect(bcrypt.compareSync(PASSWORD, HASH_FROM_DEV_DB)).toBe(true);
  });

  it('rejects a wrong password against those same hashes', () => {
    expect(bcrypt.compareSync('not-the-password', HASH_FROM_V2)).toBe(false);
    expect(bcrypt.compareSync('not-the-password', HASH_FROM_DEV_DB)).toBe(
      false,
    );
  });

  it('round-trips a hash created by the current version', () => {
    const fresh = bcrypt.hashSync(PASSWORD, 12);
    expect(bcrypt.compareSync(PASSWORD, fresh)).toBe(true);
    expect(bcrypt.compareSync('wrong', fresh)).toBe(false);
  });
});
