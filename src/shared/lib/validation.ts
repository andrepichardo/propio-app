import { z } from 'zod';

/**
 * Normalise an optional field the user may have CLEARED.
 *
 * The three states are deliberately distinct:
 *
 * - `undefined` (the payload omitted the field) → `undefined`: leave the column
 *   alone. That is what a partial update should do.
 * - `''` or `null` (the user emptied the input)  → `null`: write NULL.
 * - anything else                                → the value.
 *
 * The `null` matters. Prisma reads `undefined` as "do not touch this column",
 * so mapping an emptied field to `undefined` made clearing an optional value
 * impossible: the save reported success and the old value came straight back.
 */
export function clearEmpty<T extends string>(
  value: T | null | undefined,
): T | null | undefined {
  if (value === undefined) return undefined;
  return value === '' || value === null ? null : value;
}

/**
 * An optional, trimmed free-text field that can be cleared.
 *
 * `null` is accepted on the INPUT side as well as produced on the output side,
 * so a form typed from either side of the schema keeps compiling.
 */
export function optionalText(max: number) {
  return z.string().trim().max(max).nullish().transform(clearEmpty);
}
