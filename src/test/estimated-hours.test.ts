import { describe, expect, it } from 'vitest';
import {
  formatEstimatedHours,
  hoursToParts,
  partsToHours,
} from '@/lib/tasks/estimated-hours';

describe('hoursToParts', () => {
  it('returns null for undefined', () => {
    expect(hoursToParts(undefined)).toBeNull();
  });

  it('converts whole hours', () => {
    expect(hoursToParts(2)).toEqual({ h: 2, min: 0 });
  });

  it('converts fractional hours to h and min', () => {
    expect(hoursToParts(1.5)).toEqual({ h: 1, min: 30 });
    expect(hoursToParts(0.25)).toEqual({ h: 0, min: 15 });
  });
});

describe('partsToHours', () => {
  it('returns undefined when both parts are zero', () => {
    expect(partsToHours(0, 0)).toBeUndefined();
  });

  it('combines hours and minutes into decimal hours', () => {
    expect(partsToHours(1, 30)).toBe(1.5);
    expect(partsToHours(2, 0)).toBe(2);
    expect(partsToHours(0, 30)).toBe(0.5);
  });
});

describe('formatEstimatedHours', () => {
  it('returns empty string when undefined', () => {
    expect(formatEstimatedHours(undefined)).toBe('');
  });

  it('formats whole hours', () => {
    expect(formatEstimatedHours(2)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatEstimatedHours(1.5)).toBe('1h 30m');
  });

  it('formats minutes only when hours are zero', () => {
    expect(formatEstimatedHours(0.5)).toBe('30m');
  });
});
