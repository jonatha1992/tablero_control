import { describe, it, expect } from 'vitest';
import { formatDate, cn, getInitials, stringToColor, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'active', false && 'disabled')).toBe('base active');
    });

    it('handles falsy values', () => {
      expect(cn('base', null, undefined, false, 'extra')).toBe('base extra');
    });
  });

  describe('formatDate', () => {
    it('formats a date in Spanish locale', () => {
      const date = new Date('2026-04-13T12:00:00Z');
      const formatted = formatDate(date, 'es');
      expect(formatted).toContain('2026');
      expect(formatted).toMatch(/abr|abril|4/);
    });
  });

  describe('getInitials', () => {
    it('returns first letter of single name', () => {
      expect(getInitials('Ana')).toBe('A');
    });

    it('returns first letters of full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles three names (first letter of each word)', () => {
      expect(getInitials('Maria del Carmen')).toBe('MD');
    });

    it('uppercase output', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('stringToColor', () => {
    it('returns consistent color for same string', () => {
      const color1 = stringToColor('Ana');
      const color2 = stringToColor('Ana');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different strings', () => {
      const color1 = stringToColor('Ana');
      const color2 = stringToColor('Pedro');
      expect(color1).not.toBe(color2);
    });

    it('returns HSL format', () => {
      const color = stringToColor('Test');
      expect(color).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
    });
  });

  describe('TASK_STATUS_LABELS', () => {
    it('has labels for all statuses', () => {
      const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'] as const;
      for (const status of statuses) {
        expect(TASK_STATUS_LABELS[status]).toBeDefined();
        expect(typeof TASK_STATUS_LABELS[status]).toBe('string');
      }
    });
  });

  describe('TASK_PRIORITY_LABELS', () => {
    it('has labels for all priorities', () => {
      const priorities = ['low', 'medium', 'high', 'urgent'] as const;
      for (const priority of priorities) {
        expect(TASK_PRIORITY_LABELS[priority]).toBeDefined();
      }
    });
  });
});
