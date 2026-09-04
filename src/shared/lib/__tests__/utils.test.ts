import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib/utils';

/**
 * `cn()` is the single styling helper of the design system, and it leans on
 * `tailwind-merge` to know which utilities conflict. That knowledge is
 * VERSION-SPECIFIC: the v2 line predates Tailwind v4 and does not recognise
 * `outline-hidden`, the renamed `shadow-xs`/`blur-xs` scale, or the theme's own
 * colours — it would silently keep both classes and let the losing one win by
 * source order. These cases pin the pairing (tailwind-merge 3.x + Tailwind v4)
 * so a downgrade or a stale lockfile fails here instead of in the UI.
 */
describe('cn', () => {
  it('resolves a plain conflict, last one wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('knows the utilities Tailwind v4 renamed', () => {
    // v3 spelled these `outline-none`, `shadow-sm` and `blur-sm`.
    expect(cn('outline-none', 'outline-hidden')).toBe('outline-hidden');
    expect(cn('shadow-sm', 'shadow-xs')).toBe('shadow-xs');
    expect(cn('blur-sm', 'blur-xs')).toBe('blur-xs');
  });

  it('resolves the theme colours declared in globals.css', () => {
    expect(cn('bg-primary', 'bg-destructive')).toBe('bg-destructive');
    expect(cn('text-muted-foreground', 'text-destructive')).toBe(
      'text-destructive',
    );
  });

  it("resolves this project's custom shadows", () => {
    expect(cn('shadow-card', 'shadow-soft')).toBe('shadow-soft');
  });

  it('resolves sizing and ring widths', () => {
    expect(cn('size-4', 'size-9')).toBe('size-9');
    expect(cn('ring-1', 'ring-2')).toBe('ring-2');
    expect(cn('rounded-md', 'rounded-xl')).toBe('rounded-xl');
  });

  it('keeps conditional and falsy inputs sane', () => {
    expect(cn('p-2', false && 'p-4', undefined, null, '')).toBe('p-2');
    expect(cn('p-2', true && 'p-4')).toBe('p-4');
  });

  it('leaves non-conflicting utilities alone', () => {
    expect(cn('flex items-center', 'gap-2')).toBe('flex items-center gap-2');
  });
});
