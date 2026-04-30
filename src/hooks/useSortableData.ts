'use client';

import { useState, useMemo } from 'react';

export type SortDir = 'asc' | 'desc' | null;

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), 'es', { numeric: true });
}

export function useSortableData<T extends object>(
  data: T[],
  accessor?: (item: T, key: keyof T) => unknown,
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir('asc');
    }
  }

  const sorted = useMemo<T[]>(() => {
    if (!sortKey || !sortDir) return data;
    const k = sortKey as keyof T;
    return [...data].sort((a, b) => {
      const av = accessor ? accessor(a, k) : a[k];
      const bv = accessor ? accessor(b, k) : b[k];
      const cmp = compareValues(av, bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, accessor]);

  return { sorted, sortKey, sortDir, toggleSort };
}
