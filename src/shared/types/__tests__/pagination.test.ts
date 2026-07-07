import { describe, expect, it } from 'vitest';
import {
  buildPaginatedResult,
  MAX_PAGE_SIZE,
  normalizePagination,
} from '@/shared/types/pagination';

describe('normalizePagination', () => {
  it('applies defaults for empty input', () => {
    const result = normalizePagination({});
    expect(result).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it('computes skip from page and pageSize', () => {
    const result = normalizePagination({ page: 3, pageSize: 10 });
    expect(result.skip).toBe(20);
    expect(result.take).toBe(10);
  });

  it('clamps hostile query-string values', () => {
    expect(normalizePagination({ page: -5 }).page).toBe(1);
    expect(normalizePagination({ pageSize: 10_000 }).pageSize).toBe(
      MAX_PAGE_SIZE,
    );
    expect(normalizePagination({ pageSize: 0 }).pageSize).toBe(1);
  });
});

describe('buildPaginatedResult', () => {
  it('derives page count and navigation flags', () => {
    const result = buildPaginatedResult(['a', 'b'], 45, 2, 20);
    expect(result.pageCount).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(true);
  });

  it('handles the empty collection', () => {
    const result = buildPaginatedResult([], 0, 1, 20);
    expect(result.pageCount).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });
});
