import { isNewDate, NEW_PRODUCT_WINDOW_DAYS } from '../../shared/utils/product/isNewDate';

describe('isNewDate util', () => {
  test('exports default window of 3 days', () => {
    expect(NEW_PRODUCT_WINDOW_DAYS).toBe(3);
  });

  test('returns false for falsy timestamp', () => {
    expect(isNewDate(null)).toBe(false);
    expect(isNewDate(undefined)).toBe(false);
    expect(isNewDate('')).toBe(false);
  });

  test('correctly identifies a recent date (within default window)', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const recent = new Date(now - (oneDayMs * 1)).toISOString();
    expect(isNewDate(recent)).toBe(true);
  });

  test('correctly identifies an old date (outside default window)', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const old = new Date(now - (oneDayMs * 10)).toISOString();
    expect(isNewDate(old)).toBe(false);
  });

  test('honors custom days parameter', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const fourDaysAgo = new Date(now - (oneDayMs * 4)).toISOString();
    expect(isNewDate(fourDaysAgo, 5)).toBe(true);
    expect(isNewDate(fourDaysAgo, 3)).toBe(false);
  });
});