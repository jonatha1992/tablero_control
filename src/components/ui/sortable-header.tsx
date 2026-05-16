'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDir } from '@/hooks/useSortableData';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeSortKey: string | null;
  activeSortDir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  activeSortDir,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = activeSortKey === sortKey;

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        'text-left px-4 py-3 font-medium cursor-pointer select-none transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && activeSortDir === 'asc' && <ChevronUp className="h-3.5 w-3.5 shrink-0" />}
        {isActive && activeSortDir === 'desc' && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        {!isActive && <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-30" />}
      </span>
    </th>
  );
}
