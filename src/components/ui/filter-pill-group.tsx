'use client';

import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterPillGroupProps<T extends string> {
  options: ReadonlyArray<Option<T>>;
  value: T;
  onChange: (value: T) => void;
}

export function FilterPillGroup<T extends string>({
  options,
  value,
  onChange,
}: FilterPillGroupProps<T>) {
  return (
    <div className="flex gap-1 rounded-lg border p-1 bg-background">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 rounded-md text-sm transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
