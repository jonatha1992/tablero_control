'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
}

export function Checkbox({ className, indeterminate, ...props }: CheckboxProps) {
  return (
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        className={cn(
          'peer h-4 w-4 cursor-pointer appearance-none rounded border border-border bg-background transition-colors',
          'checked:border-primary checked:bg-primary',
          'indeterminate:border-primary indeterminate:bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate ?? false;
        }}
        {...props}
      />
      <Check className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      <span className="pointer-events-none absolute h-0.5 w-2 bg-primary-foreground opacity-0 peer-indeterminate:opacity-100" />
    </div>
  );
}
